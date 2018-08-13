function mergeVisitedInstructions(
	targetVisitedInstructions: number[],
	otherVisitedInstructions: number[],
	programLength: number
) {
	for (let i = 0; i < programLength; ++i) {
		const ourGeneration = targetVisitedInstructions[i];
		const otherGeneration = otherVisitedInstructions[i];

		if (ourGeneration === undefined) {
			targetVisitedInstructions[i] = otherGeneration;
		} else if (otherGeneration !== undefined) {
			targetVisitedInstructions[i] = Math.max(ourGeneration, otherGeneration);
		}
	}
}

/**
 * A Trace represents the execution history of a Thread
 */
export default class Trace {
	public records: any[] = [];
	public prefixes: Trace[] = [];

	private _descendants: Trace[] = [];
	private _isCompacted: boolean = false;
	private _programLength: number;
	private _visitedInstructions: number[];

	/**
	 * @param pc               Program counter for the scheduled instruction
	 * @param programLength    Length of the current program
	 * @param precedingTrace   The trace to append this trace to
	 * @param generationNumber The index of the genaration this Trace's Thread is running in
	 */
	constructor(
		pc: number,
		programLength: number,
		precedingTrace: Trace | null,
		generationNumber: number
	) {
		this._programLength = programLength;

		if (precedingTrace) {
			this.prefixes.push(precedingTrace);
			precedingTrace._descendants.push(this);
			this._visitedInstructions = precedingTrace._visitedInstructions.slice(0);
		} else {
			this._visitedInstructions = new Array(programLength);
		}
		this._visitedInstructions[pc] = generationNumber;
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

		(function mergeVisitedInstructionsIntoTrace(trace: Trace) {
			// Merge prefixTrace's set of visited instructions into our own
			mergeVisitedInstructions(
				trace._visitedInstructions,
				prefixTrace._visitedInstructions,
				trace._programLength
			);
			// Do the same for the descendants
			for (let i = 0, l = trace._descendants.length; i < l; ++i) {
				mergeVisitedInstructionsIntoTrace(trace._descendants[i]);
			}
		})(this);
	}

	/**
	 * Returns whether the Trace has visited the specified instruction, in the given generation.
	 *
	 * If no generation is given, it is tested if the trace has passed the instruction at all.
	 *
	 * @param pc         Program counter for the instruction to test
	 * @param generation The index of the generation to test for
	 *
	 * @return Whether the trace has visited the instruction
	 */
	contains(pc: number, generation?: number): boolean {
		if (generation === undefined) {
			return this._visitedInstructions[pc] !== undefined;
		}
		return this._visitedInstructions[pc] === generation;
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
