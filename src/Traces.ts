import Trace from './Trace';

export default class Traces {
	// Incoming steps (origin pc) by pc
	private _fromByPc: number[][] = [];
	private _fromBySurvivorPc: number[][] = [];
	private _survivors: Set<number> = new Set();

	// Records generated by pc in the current generation
	private _recordByPc: any[] = [];

	// Traces for anything that survived until now, updated when the current generation ends
	private _traceBySurvivorPc: Map<number, Trace> = new Map();

	constructor(programLength: number) {
		for (let i = 0; i < programLength; ++i) {
			this._fromByPc.push([]);
			this._fromBySurvivorPc.push([]);
			this._recordByPc.push(null);
		}

		this._traceBySurvivorPc.set(0, Trace.EMPTY);
	}

	public reset(clearSurvivors: boolean): void {
		this._fromByPc.forEach(originPcs => {
			originPcs.length = 0;
		});
		this._fromBySurvivorPc.forEach(originPcs => {
			originPcs.length = 0;
		});
		this._survivors.clear();

		this._recordByPc.fill(null);

		if (clearSurvivors) {
			this._traceBySurvivorPc.clear();
			this._traceBySurvivorPc.set(0, Trace.EMPTY);
		}
	}

	public record(pc: number, record: any): void {
		this._recordByPc[pc] = record;
	}

	public has(pc: number): boolean {
		return this._fromByPc[pc].length > 0 || this._traceBySurvivorPc.has(pc);
	}

	public add(fromPc: number, toPc: number): void {
		this._fromByPc[toPc].push(fromPc);
	}

	public hasSurvivor(pc: number): boolean {
		return this._survivors.has(pc);
	}

	public addSurvivor(fromPc: number, toPc: number): void {
		this._fromBySurvivorPc[toPc].push(fromPc);
		this._survivors.add(toPc);
	}

	public buildSurvivorTraces(): void {
		const previousTraceBySurvivorPc = this._traceBySurvivorPc;
		const prefixesByPc = new Map<number, Set<Trace>>();
		const fromByPc = this._fromByPc;
		const recordByPc = this._recordByPc;
		function trace(pc: number): Set<Trace> {
			let prefix = prefixesByPc.get(pc);
			if (prefix !== undefined) {
				return prefix;
			}

			const prefixes: Set<Trace> = new Set();
			prefixesByPc.set(pc, prefixes);
			const startingTrace = previousTraceBySurvivorPc.get(pc);
			if (startingTrace !== undefined) {
				prefixes.add(startingTrace);
			} else if (fromByPc[pc].length === 0) {
				throw new Error(`Trace without source at pc ${pc}`);
			}
			fromByPc[pc].forEach(fromPc => {
				trace(fromPc).forEach(prefix => prefixes.add(prefix));
			});

			const record = recordByPc[pc];
			if (record !== null) {
				const prefixesArray = Array.from(prefixes);
				prefixes.clear();
				prefixes.add(
					// TODO: merge record arrays over non-forking / non-joining edges
					new Trace(
						prefixesArray.length === 0 ||
						(prefixesArray.length === 1 && prefixesArray[0] === Trace.EMPTY)
							? []
							: prefixesArray,
						[record]
					)
				);
			}

			return prefixes;
		}

		function createTrace(prefixes: Trace[]) {
			return prefixes.length === 1 ? prefixes[0] : new Trace(prefixes, null);
		}

		this._traceBySurvivorPc = new Map();
		this._survivors.forEach(pc => {
			const prefixes = this._fromBySurvivorPc[pc].reduce((prefixes, pc) => {
				trace(pc).forEach(trace => prefixes.add(trace));
				return prefixes;
			}, new Set());
			this._traceBySurvivorPc.set(pc, createTrace(Array.from(prefixes)));
		});
	}

	public getTraces(acceptedPcs: number[]): Trace[] {
		return acceptedPcs.map(pc => this._traceBySurvivorPc.get(pc)!);
	}
}
