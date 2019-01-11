import FromBuffer from './FromBuffer';
import ProgramInfo from './ProgramInfo';
import Trace from './Trace';
import Tracer from './Tracer';

export default class Traces<TRecord> {
	// Incoming steps (origin pc) by pc
	private readonly _fromByPc: FromBuffer;
	private readonly _fromBySurvivorPc: FromBuffer;

	// Records generated by pc in the current generation
	private readonly _recordByPc: (TRecord | null)[] = [];

	// Traces for anything that survived until now, updated when the current generation ends.
	// These swap each generation in order to minimize allocations.
	private _traceBySurvivorPc: (Trace<TRecord> | null)[] = [];
	private _nextTraceBySurvivorPc: (Trace<TRecord> | null)[] = [];

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

	public record(pc: number, record: any): void {
		this._recordByPc[pc] = record;
	}

	public has(pc: number): boolean {
		return this._fromByPc.has(pc) || this._traceBySurvivorPc[pc] !== null;
	}

	public add(fromPc: number, toPc: number): void {
		this._fromByPc.add(fromPc, toPc);
	}

	public hasSurvivor(pc: number): boolean {
		return this._fromBySurvivorPc.has(pc);
	}

	public addSurvivor(fromPc: number, toPc: number): void {
		this._fromBySurvivorPc.add(fromPc, toPc);
	}

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

	public getTraces(acceptedPcs: number[]): Trace<TRecord>[] {
		return acceptedPcs.map(pc => this._traceBySurvivorPc[pc]!);
	}
}
