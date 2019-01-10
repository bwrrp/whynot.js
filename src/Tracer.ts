import FromBuffer from './FromBuffer';
import Trace from './Trace';

const EMPTY_SET: Set<Trace> = new Set();

function createOrReuseTrace(prefixes: Trace[]) {
	return prefixes.length === 1 ? prefixes[0] : new Trace(prefixes, null);
}

enum TracingState {
	NOT_VISITED,
	IN_CURRENT_PATH,
	DONE
}

export default class Tracer {
	private _stateByPc: TracingState[] = [];
	private _prefixesByPc: (Set<Trace> | null)[] = [];

	constructor(programLength: number) {
		for (let i = 0; i < programLength; ++i) {
			this._stateByPc.push(TracingState.NOT_VISITED);
			this._prefixesByPc.push(null);
		}
	}

	private trace(
		pc: number,
		previousTraceBySurvivorPc: (Trace | null)[],
		fromByPc: FromBuffer,
		recordByPc: any[]
	): Set<Trace> {
		const state = this._stateByPc[pc];
		switch (state) {
			case TracingState.DONE:
				return this._prefixesByPc[pc]!;

			case TracingState.IN_CURRENT_PATH:
				// Trace is a cycle, ignore this path
				return EMPTY_SET;
		}

		// Create new cache entry and mark its state to detect cycles
		const prefixes = new Set();
		this._prefixesByPc[pc] = prefixes;
		this._stateByPc[pc] = TracingState.IN_CURRENT_PATH;

		const startingTrace = previousTraceBySurvivorPc[pc];
		if (startingTrace !== null) {
			prefixes.add(startingTrace);
		} else if (!fromByPc.has(pc)) {
			throw new Error(`Trace without source at pc ${pc}`);
		}
		fromByPc.forEach(pc, fromPc => {
			this.trace(fromPc, previousTraceBySurvivorPc, fromByPc, recordByPc).forEach(prefix =>
				prefixes.add(prefix)
			);
		});

		if (prefixes.size > 0) {
			// Valid prefixes found, check for records
			const record = recordByPc[pc];
			if (record !== null) {
				const prefixesArray = Array.from(prefixes);
				prefixes.clear();
				prefixes.add(
					// TODO: merge record arrays over non-forking / non-joining edges
					new Trace(
						prefixesArray.length === 1 && prefixesArray[0] === Trace.EMPTY
							? []
							: prefixesArray,
						[record]
					)
				);
			}
		}

		// Mark cached entry as complete
		this._stateByPc[pc] = TracingState.DONE;
		return prefixes;
	}

	public buildSurvivorTraces(
		previousTraceBySurvivorPc: (Trace | null)[],
		newTraceBySurvivorPc: (Trace | null)[],
		fromBySurvivorPc: FromBuffer,
		fromByPc: FromBuffer,
		recordByPc: any[]
	): void {
		this._prefixesByPc.fill(null);
		this._stateByPc.fill(TracingState.NOT_VISITED);
		for (
			let pc = 0, programLength = previousTraceBySurvivorPc.length;
			pc < programLength;
			++pc
		) {
			if (!fromBySurvivorPc.has(pc)) {
				newTraceBySurvivorPc[pc] = null;
				continue;
			}

			const prefixes: Set<Trace> = new Set();
			fromBySurvivorPc.forEach(pc, fromPc => {
				this.trace(fromPc, previousTraceBySurvivorPc, fromByPc, recordByPc).forEach(trace =>
					prefixes.add(trace)
				);
			});
			newTraceBySurvivorPc[pc] = createOrReuseTrace(Array.from(prefixes));
		}
		// Free prefix sets for GC
		this._prefixesByPc.fill(null);
	}
}
