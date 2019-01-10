import FromBuffer from './FromBuffer';
import { LazySet, mergeLazySets } from './LazySet';
import Trace from './Trace';

function createOrReuseTrace(prefixes: Exclude<LazySet<Trace>, null>, records: any[] | null): Trace {
	let prefixesArray: Trace[];
	if (records === null) {
		if (!Array.isArray(prefixes)) {
			return prefixes;
		}
		prefixesArray = prefixes;
	} else if (prefixes === Trace.EMPTY) {
		// No need to include empty prefixes on the new trace with a record
		prefixesArray = [];
	} else if (Array.isArray(prefixes)) {
		prefixesArray = prefixes;
	} else {
		prefixesArray = [prefixes];
	}

	return new Trace(prefixesArray, records);
}

enum TracingState {
	NOT_VISITED,
	IN_CURRENT_PATH,
	DONE
}

export default class Tracer {
	private _stateByPc: TracingState[] = [];
	private _prefixesByPc: LazySet<Trace>[] = [];

	constructor(programLength: number) {
		for (let i = 0; i < programLength; ++i) {
			this._stateByPc.push(TracingState.NOT_VISITED);
			this._prefixesByPc.push(null);
		}
	}

	private mergeTraces(
		prefixes: LazySet<Trace>,
		pc: number,
		startingFromBuffer: FromBuffer,
		previousTraceBySurvivorPc: (Trace | null)[],
		fromByPc: FromBuffer,
		recordByPc: any[]
	): LazySet<Trace> {
		let isPrefixesReused = false;
		startingFromBuffer.forEach(pc, fromPc => {
			const traces = this.trace(fromPc, previousTraceBySurvivorPc, fromByPc, recordByPc);
			prefixes = mergeLazySets(prefixes, traces, isPrefixesReused);
			isPrefixesReused = prefixes === traces;
		});
		return prefixes;
	}

	private trace(
		pc: number,
		previousTraceBySurvivorPc: (Trace | null)[],
		fromByPc: FromBuffer,
		recordByPc: any[]
	): LazySet<Trace> {
		const state = this._stateByPc[pc];
		switch (state) {
			case TracingState.DONE:
				return this._prefixesByPc[pc];

			case TracingState.IN_CURRENT_PATH:
				// Trace is a cycle, ignore this path
				return null;
		}

		// Mark state to detect cycles
		this._stateByPc[pc] = TracingState.IN_CURRENT_PATH;

		let prefixes: LazySet<Trace> = null;
		const startingTrace = previousTraceBySurvivorPc[pc];
		if (startingTrace !== null) {
			prefixes = startingTrace;
		} else if (!fromByPc.has(pc)) {
			throw new Error(`Trace without source at pc ${pc}`);
		}
		prefixes = this.mergeTraces(
			prefixes,
			pc,
			fromByPc,
			previousTraceBySurvivorPc,
			fromByPc,
			recordByPc
		);

		if (prefixes !== null) {
			// Valid prefixes found, check for records
			const record = recordByPc[pc];
			if (record !== null) {
				prefixes = createOrReuseTrace(prefixes, [record]);
			}
		}

		// Add to cache and mark as complete
		this._prefixesByPc[pc] = prefixes;
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

			const prefixes: LazySet<Trace> = this.mergeTraces(
				null,
				pc,
				fromBySurvivorPc,
				previousTraceBySurvivorPc,
				fromByPc,
				recordByPc
			);
			newTraceBySurvivorPc[pc] = createOrReuseTrace(prefixes!, null);
		}
		// Free prefix sets for GC
		this._prefixesByPc.fill(null);
	}
}
