import Generation from './Generation';
import ProgramInfo from './ProgramInfo';
import Trace from './Trace';
import Traces from './Traces';

export default class Scheduler<TRecord> {
	private _currentGeneration: Generation;
	private _nextGeneration: Generation;

	// Trace data for the current generation
	private _traces: Traces<TRecord>;

	// PCs of accepted threads in the current generation
	private _acceptedPcs: number[] = [];

	constructor(programInfo: ProgramInfo) {
		this._currentGeneration = new Generation(programInfo.programLength);
		this._nextGeneration = new Generation(programInfo.programLength);
		this._traces = new Traces(programInfo);
	}

	public reset(): void {
		this._currentGeneration.reset();
		this._currentGeneration.add(0, 0);

		this._acceptedPcs.length = 0;
		this._traces.reset(true);
	}

	public getNextThreadPc(): number | null {
		return this._currentGeneration.getNextPc();
	}

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

	public accept(pc: number): void {
		this._acceptedPcs.push(pc);
		this._traces.addSurvivor(pc, pc);
	}

	public fail(_pc: number): void {
		// TODO: track failures as the combination of input x instruction?
	}

	public record(pc: number, record: any): void {
		this._traces.record(pc, record);
	}

	public nextGeneration(): void {
		this._traces.buildSurvivorTraces();

		this._traces.reset(false);

		const gen = this._currentGeneration;
		gen.reset();
		this._currentGeneration = this._nextGeneration;
		this._nextGeneration = gen;
	}

	public getAcceptingTraces(): Trace<TRecord>[] {
		return this._traces.getTraces(this._acceptedPcs);
	}
}
