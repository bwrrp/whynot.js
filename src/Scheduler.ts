import Generation from './Generation';
import ProgramInfo from './ProgramInfo';
import Trace from './Trace';
import Traces from './Traces';

/**
 * Responsible for tracking all execution state for a running VM.
 *
 * This manages scheduling of threads for the current and next generation using two instances of
 * Generation. It also handles tracking steps for the current generation and updating Trace
 * instances for any survivors (i.e., threads that made it to the next generation) using a Traces
 * instance.
 *
 * Note that threads are not represented directly. Generation only schedules program counter (pc)
 * values with a corresponding badness. Traces only tracks steps taken through the program. At the
 * end of all input, we're only interested in the unique paths taken to get there in terms of the
 * records collected along the way.
 */
export default class Scheduler<TRecord> {
	private _currentGeneration: Generation;
	private _nextGeneration: Generation;

	// Trace data for the current generation
	private readonly _traces: Traces<TRecord>;

	// PCs of accepted threads in the current generation
	private readonly _acceptedPcs: number[] = [];

	constructor(programInfo: ProgramInfo) {
		this._currentGeneration = new Generation(programInfo.programLength);
		this._nextGeneration = new Generation(programInfo.programLength);
		this._traces = new Traces(programInfo);
	}

	/**
	 * Clears all information for a new run of the program.
	 */
	public reset(): void {
		this._currentGeneration.reset();
		this._currentGeneration.add(0, 0);

		this._acceptedPcs.length = 0;
		this._traces.reset(true);
	}

	/**
	 * Get the pc for the next thread to execute, or null if there are no more threads to run in the
	 * current generation.
	 */
	public getNextThreadPc(): number | null {
		return this._currentGeneration.getNextPc();
	}

	/**
	 * Step the thread forward, updating traces and scheduling the new thread in the current
	 * generation.
	 *
	 * @param fromPc       - The current pc being executed
	 * @param toPc         - The pc at which to continue
	 * @param badnessDelta - The amount by which to increase badness for toPc
	 */
	public step(fromPc: number, toPc: number, badnessDelta: number) {
		const alreadyScheduled = this._traces.has(toPc);
		this._traces.add(fromPc, toPc);

		const badness = this._currentGeneration.getBadness(fromPc) + badnessDelta;
		if (alreadyScheduled) {
			this._currentGeneration.reschedule(toPc, badness);
			return;
		}

		// Schedule the next step
		this._currentGeneration.add(toPc, badness);
	}

	/**
	 * Step the thread forward, updating traces and scheduling the new thread in the next
	 * generation.
	 *
	 * @param fromPc       - The current pc being executed
	 * @param toPc         - The pc at which to continue
	 */
	public stepToNextGeneration(fromPc: number, toPc: number) {
		const alreadyScheduled = this._traces.hasSurvivor(toPc);
		this._traces.addSurvivor(fromPc, toPc);

		const badness = this._currentGeneration.getBadness(fromPc);
		if (alreadyScheduled) {
			this._nextGeneration.reschedule(toPc, badness);
			return;
		}

		this._nextGeneration.add(toPc, badness);
	}

	/**
	 * Marks the thread ending at pc as successful (i.e., it executed an accept instruction when all
	 * input has been processed). The trace for pc will be included in the result returned from
	 * VM.execute().
	 *
	 * @param pc - The current pc being executed (corresponding to an accept instruction)
	 */
	public accept(pc: number): void {
		this._acceptedPcs.push(pc);
		this._traces.addSurvivor(pc, pc);
	}

	/**
	 * Marks the thread ending at pc as failed, i.e., it was stopped from continuing execution. This
	 * could happen in the following cases:
	 *
	 * - it executed an accept instruction while not all input has been processed
	 * - it executed a fail instruction (for which the callback returned true if there was one)
	 * - it executed a test instruction for which the callback returned false
	 * - it executed a jump instruction with no targets
	 *
	 * This does not currently do anything, but could be used to determine an explanation why input
	 * was not accepted by the VM in a future version.
	 *
	 * @param _pc - The current pc being executed (corresponding to one of the cases mentioned)
	 */
	public fail(_pc: number): void {
		// TODO: track failures as the combination of input x instruction?
	}

	/**
	 * Adds a record for traces that include the pc.
	 *
	 * @param pc     - The pc for which to add the record, corresponding to a record instruction.
	 * @param record - The record to add.
	 */
	public record(pc: number, record: TRecord): void {
		this._traces.record(pc, record);
	}

	/**
	 * Updates traces for survivors and switches to the next generation. To be called when there are
	 * no more threads scheduled in the current generation (i.e., getNextThreadPc returns null).
	 */
	public nextGeneration(): void {
		this._traces.buildSurvivorTraces();

		this._traces.reset(false);

		const gen = this._currentGeneration;
		gen.reset();
		this._currentGeneration = this._nextGeneration;
		this._nextGeneration = gen;
	}

	/**
	 * Returns the unique traces for all accepted pcs. To be called after the generation for the
	 * last input item has completed.
	 */
	public getAcceptingTraces(): Trace<TRecord>[] {
		return this._traces.getTraces(this._acceptedPcs);
	}
}
