import FromBuffer from './FromBuffer';
import { addToLazySet, LazySet } from './LazySet';
import ProgramInfo from './ProgramInfo';
import Trace from './Trace';
import Tracer from './Tracer';

/**
 * Records information needed to build Trace instances after each generation concludes.
 */
export default class Traces<TRecord> {
	/**
	 * Incoming steps (in terms of the pc these originated from by target pc), for steps within the
	 * current generation.
	 */
	private readonly _fromByPc: FromBuffer;

	/**
	 * Incoming steps (in terms of the pc these originated from by target pc), for steps that lead
	 * to the next generation.
	 */
	private readonly _fromBySurvivorPc: FromBuffer;

	/**
	 * Records generated, by pc, in the current generation
	 */
	private readonly _recordByPc: (TRecord | null)[] = [];

	/**
	 * Traces for anything that survived until the start of the generation, updated when the current
	 * generation ends. Swaps with _nextTraceBySurvivorPc after each generation in order to minimize
	 * allocations.
	 */
	private _traceBySurvivorPc: (Trace<TRecord> | null)[] = [];

	/**
	 * Array in which to build traces for the next generation when the current one ends. Swaps with
	 * _traceBySurvivorPc after each generation in order to minimize allocations.
	 */
	private _nextTraceBySurvivorPc: (Trace<TRecord> | null)[] = [];

	/**
	 * Helper used for updating traces between generations.
	 */
	private readonly _tracer: Tracer<TRecord>;

	constructor(programInfo: ProgramInfo) {
		this._fromByPc = new FromBuffer(programInfo.maxFromByPc);
		this._fromBySurvivorPc = new FromBuffer(programInfo.maxSurvivorFromByPc);
		this._tracer = new Tracer(programInfo.programLength);
		for (let i = 0; i < programInfo.programLength; ++i) {
			this._recordByPc.push(null);
			this._traceBySurvivorPc.push(null);
			this._nextTraceBySurvivorPc.push(null);
		}

		this._traceBySurvivorPc[0] = Trace.EMPTY;
	}

	/**
	 * Clear the instance after each generation or for a new run of the VM.
	 *
	 * @param clearSurvivors - Set to true to clear survivor traces when resetting for a new run.
	 *                         Set to false when moving to the next generation to preserve these.
	 */
	public reset(clearSurvivors: boolean): void {
		this._fromByPc.clear();
		this._fromBySurvivorPc.clear();

		this._recordByPc.fill(null);

		if (clearSurvivors) {
			this._traceBySurvivorPc.fill(null);
			this._nextTraceBySurvivorPc.fill(null);
			this._traceBySurvivorPc[0] = Trace.EMPTY;
		}
	}

	/**
	 * Add a record for the current generation
	 *
	 * @param pc     - The pc of the record instruction this record originates from
	 * @param record - The data to record
	 */
	public record(pc: number, record: TRecord): void {
		this._recordByPc[pc] = record;
	}

	/**
	 * Returns whether the given instruction has already been visited during the current generation.
	 *
	 * This is determined by it having incoming entries in the corresponding FromBuffer, or by it
	 * having an incoming trace from the previous generation.
	 *
	 * @param pc The pc to check.
	 */
	public has(pc: number): boolean {
		return this._fromByPc.has(pc) || this._traceBySurvivorPc[pc] !== null;
	}

	/**
	 * Record the given step within the current generation.
	 *
	 * @param fromPc - Origin of the step
	 * @param toPc   - Target of the step
	 */
	public add(fromPc: number, toPc: number): void {
		this._fromByPc.add(fromPc, toPc);
	}

	/**
	 * Returns whether the given instruction has been stepped to for the next generation.
	 *
	 * This is determined by it having incoming entries in the corresponding FromBuffer.
	 *
	 * @param pc The pc to check.
	 */
	public hasSurvivor(pc: number): boolean {
		return this._fromBySurvivorPc.has(pc);
	}

	/**
	 * Record the given step from the current generation to the next.
	 *
	 * @param fromPc - Origin of the step
	 * @param toPc   - Target of the step
	 */
	public addSurvivor(fromPc: number, toPc: number): void {
		this._fromBySurvivorPc.add(fromPc, toPc);
	}

	/**
	 * Builds traces for each survivor after a generation ends.
	 *
	 * Swaps the _traceBySurvivorPc and _nextTraceBySurvivorPc arrays afterwards to avoid
	 * allocations.
	 */
	public buildSurvivorTraces(): void {
		const previousTraceBySurvivorPc = this._traceBySurvivorPc;
		this._tracer.buildSurvivorTraces(
			previousTraceBySurvivorPc,
			this._nextTraceBySurvivorPc,
			this._fromBySurvivorPc,
			this._fromByPc,
			this._recordByPc
		);
		// Swap arrays
		this._traceBySurvivorPc = this._nextTraceBySurvivorPc;
		this._nextTraceBySurvivorPc = previousTraceBySurvivorPc;
	}

	/**
	 * Returns unique traces for all threads that reached accept after all input has been processed.
	 *
	 * Should be called after the last generation finishes.
	 *
	 * @param acceptedPcs - The pcs for which to compute traces. These should all have survived the
	 *                      last generation.
	 */
	public getTraces(acceptedPcs: number[]): Trace<TRecord>[] {
		const traces = acceptedPcs.reduce(
			(traces: LazySet<Trace<TRecord>>, pc: number) =>
				addToLazySet(traces, this._traceBySurvivorPc[pc]!),
			null
		);
		if (traces === null) {
			return [];
		}
		return Array.isArray(traces) ? traces : [traces];
	}
}
