/**
 * A Trace represents the execution history of a Thread
 */
export default class Trace {

	public records: any[] = [];
	public prefixes: Trace[] = [];

	private _isCompacted: boolean = false;

	/**
	 * @param precedingTrace   The trace to append this trace to
	 */
	constructor(
		precedingTrace: Trace | null
	) {
		if (precedingTrace) {
			this.prefixes.push(precedingTrace);
		}
	}

	/**
	 * Combines the Trace with the given prefix, thereby recording multiple ways to get to the
	 * current trace's head.
	 *
	 * Assumes the Trace has not yet been compacted.
	 *
	 * @param prefixTrace The Trace to add as a prefix of the current
	 */
	join(prefixTrace: Trace) {
		this.prefixes.push(prefixTrace);
		this._isCompacted = false;
	}

	/**
	 * Compacts the trace, concatenating all non-branching prefixes.
	 */
	compact() {
		if (this._isCompacted) {
			return;
		}

		let trace: Trace = this;
		while (trace.prefixes.length === 1) {
			// Trace has a single prefix, combine traces
			const prefix = trace.prefixes[0];
			// Combine records
			this.records.unshift.apply(this.records, prefix.records);
			// Adopt prefixes
			this.prefixes = prefix.prefixes;
			// Continue
			trace = prefix;
		}
		this._isCompacted = true;

		// Recurse
		for (let i = 0, l = trace.prefixes.length; i < l; ++i) {
			trace.prefixes[i].compact();
		}
	}
}
