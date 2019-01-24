import FromBuffer from './FromBuffer';
import { LazySet, mergeLazySets } from './LazySet';
import Trace from './Trace';

/**
 * Create a trace only when necessary.
 *
 * Not adding records to a single prefix can be represented by the prefix itself. Similarly, adding
 * a record to only the empty trace can omit the empty trace from the prefixes of the new trace.
 *
 * Finally, if the LazySet of prefixes was already an array, this reuses that array in the trace,
 * avoiding an extra allocation.
 *
 * @param prefixes - Non-empty LazySet of Trace instances, representing the unique ways to get here
 * @param record   - Optional record to include in the Trace
 */
function createOrReuseTrace<TRecord>(
	prefixes: Exclude<LazySet<Trace<TRecord>>, null>,
	record: TRecord | null
): Trace<TRecord> {
	let prefixesArray: Trace<TRecord>[];
	if (record === null) {
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

	return new Trace(prefixesArray, record);
}

/**
 * Used to ensure that each instruction is visited only once per survivor, and to abort cyclic paths
 * so traces constructed never form cycles.
 */
const enum TracingState {
	NOT_VISITED,
	IN_CURRENT_PATH,
	DONE
}

/**
 * Handles updating Trace instances across each generation, while minimizing allocations.
 */
export default class Tracer<TRecord> {
	private readonly _stateByPc: TracingState[] = [];
	private readonly _prefixesByPc: LazySet<Trace<TRecord>>[] = [];

	constructor(programLength: number) {
		for (let i = 0; i < programLength; ++i) {
			this._stateByPc.push(TracingState.NOT_VISITED);
			this._prefixesByPc.push(null);
		}
	}

	/**
	 * Determines traces for each entry in startingFromBuffer for pc, and adds them to prefixes,
	 * returning the resulting LazySet.
	 *
	 * Steps taken by trace() after the first step use the fromByPc FromBuffer instead of the
	 * startingFromBuffer. This supports the fact that the first step is always from a survivor, so
	 * should be taken in the survivor from buffer, while the rest of the steps are within the
	 * generation.
	 */
	private mergeTraces(
		prefixes: LazySet<Trace<TRecord>>,
		pc: number,
		startingFromBuffer: FromBuffer,
		previousTraceBySurvivorPc: (Trace<TRecord> | null)[],
		fromByPc: FromBuffer,
		recordByPc: (TRecord | null)[]
	): LazySet<Trace<TRecord>> {
		let isPrefixesReused = false;
		startingFromBuffer.forEach(pc, fromPc => {
			const traces = this.trace(fromPc, previousTraceBySurvivorPc, fromByPc, recordByPc);
			prefixes = mergeLazySets(prefixes, traces, isPrefixesReused);
			isPrefixesReused = prefixes === traces;
		});
		return prefixes;
	}

	/**
	 * Determines traces leading to pc, stepping through fromByPc and using incoming traces (i.e.,
	 * from a previous generation) from previousTraceBySurvivorPc.
	 *
	 * To prevent allocations, traces are represented as a LazySet of their prefixes for as long as
	 * possible, which usually means until a record has to be added.
	 *
	 * @param pc                        - The pc from which to trace
	 * @param previousTraceBySurvivorPc - Incoming traces (built up in the previous generation)
	 * @param fromByPc                  - The FromBuffer to trace through
	 * @param recordByPc                - Records to include when a trace passes through the
	 *                                    corresponding pc.
	 */
	private trace(
		pc: number,
		previousTraceBySurvivorPc: (Trace<TRecord> | null)[],
		fromByPc: FromBuffer,
		recordByPc: (TRecord | null)[]
	): LazySet<Trace<TRecord>> {
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

		let prefixes: LazySet<Trace<TRecord>> = null;
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
				prefixes = createOrReuseTrace(prefixes, record);
			}
		}

		// Add to cache and mark as complete
		this._prefixesByPc[pc] = prefixes;
		this._stateByPc[pc] = TracingState.DONE;
		return prefixes;
	}

	/**
	 * Populates newTraceBySurvivorPc with traces constructed from tracing for any survivor (i.e.,
	 * those pcs having any entries in fromBySurvivorPc). Tracing takes the first step in
	 * fromBySurvivorPc and then proceeds through fromByPc until complete, gathering unique traces
	 * by combining incoming traces (from previousTraceBySurvivorPc) with new records (from
	 * recordByPc) gathered along the way.
	 *
	 * @param previousTraceBySurvivorPc - Incoming traces (built up in the previous generation)
	 * @param newTraceBySurvivorPc      - Array to populate with new traces (or null for
	 *                                    non-survivor pcs)
	 * @param fromBySurvivorPc          - The FromBuffer with the final steps for each thread (from
	 *                                    within the generation to being a survivor)
	 * @param fromByPc                  - The FromBuffer with all other steps taken within the
	 *                                    generation.
	 * @param recordByPc                - Records generated during the generation.
	 */
	public buildSurvivorTraces(
		previousTraceBySurvivorPc: (Trace<TRecord> | null)[],
		newTraceBySurvivorPc: (Trace<TRecord> | null)[],
		fromBySurvivorPc: FromBuffer,
		fromByPc: FromBuffer,
		recordByPc: (TRecord | null)[]
	): void {
		for (
			let pc = 0, programLength = previousTraceBySurvivorPc.length;
			pc < programLength;
			++pc
		) {
			if (!fromBySurvivorPc.has(pc)) {
				newTraceBySurvivorPc[pc] = null;
				continue;
			}

			// Some cached results may depend on detected cycles. The points at which a cycle should
			// no longer be followed differ between survivors, so these cached results are not
			// transferrable between them. To work around this, we reset the tracing state and cache
			// before tracing each survivor, and later deduplicate results in Traces.getTraces().
			this._prefixesByPc.fill(null);
			this._stateByPc.fill(TracingState.NOT_VISITED);
			const prefixes: LazySet<Trace<TRecord>> = this.mergeTraces(
				null,
				pc,
				fromBySurvivorPc,
				previousTraceBySurvivorPc,
				fromByPc,
				recordByPc
			);
			if (prefixes === null) {
				throw new Error(`No non-cyclic paths found to survivor ${pc}`);
			}
			newTraceBySurvivorPc[pc] = createOrReuseTrace(prefixes, null);
		}
		// Free prefix sets for GC
		this._prefixesByPc.fill(null);
	}
}
