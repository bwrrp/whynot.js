function findInsertionIndex(
	pcs: Uint16Array,
	badnessByPc: Uint8Array,
	badness: number,
	first: number,
	length: number
) {
	// Perform a binary search to find the index of the first thread with lower badness
	let low = first;
	let high = length;
	while (low < high) {
		// Use zero-filling shift as integer division
		const mid = (low + high) >>> 1;
		// Compare to mid point, preferring right in case of equality
		if (badness < badnessByPc[pcs[mid]]) {
			// Thread goes in lower half
			high = mid;
		} else {
			// Thread goes in upper half
			low = mid + 1;
		}
	}

	return low;
}

/**
 * Schedules threads within a generation according to badness
 */
export default class Generation {
	// Program counters of scheduled threads in order of execution
	private _scheduledPcs: Uint16Array;
	private _numScheduledPcs: number = 0;

	// Index of the next thread to execute in the array above
	private _nextThread: number = 0;

	// Badness values for scheduled threads by program counter
	private _badnessByPc: Uint8Array;

	constructor(programLength: number) {
		this._scheduledPcs = new Uint16Array(programLength);
		this._badnessByPc = new Uint8Array(programLength);
	}

	public getBadness(pc: number): number {
		return this._badnessByPc[pc];
	}

	public add(pc: number, badness: number): void {
		this._badnessByPc[pc] = badness;
		const insertionIndex = findInsertionIndex(
			this._scheduledPcs,
			this._badnessByPc,
			badness,
			this._nextThread,
			this._numScheduledPcs
		);
		this._scheduledPcs.copyWithin(insertionIndex + 1, insertionIndex, this._numScheduledPcs);
		this._scheduledPcs[insertionIndex] = pc;
		this._numScheduledPcs += 1;
	}

	public reschedule(pc: number, badness: number): void {
		const maxBadness = Math.max(this._badnessByPc[pc], badness);
		if (this._badnessByPc[pc] !== maxBadness) {
			// Remove any existing unexecuted thread in order to reschedule it
			const existingThreadIndex = this._scheduledPcs.indexOf(pc, this._nextThread);
			if (existingThreadIndex < 0 || existingThreadIndex >= this._numScheduledPcs) {
				this._badnessByPc[pc] = maxBadness;
				// Thread has already been executed, do not reschedule
				return;
			}

			// Remove and re-schedule the thread
			// TODO: use a single copyWithin call instead of two
			this._scheduledPcs.copyWithin(
				existingThreadIndex,
				existingThreadIndex + 1,
				this._numScheduledPcs
			);
			this._numScheduledPcs -= 1;
			this.add(pc, maxBadness);
		}
	}

	public getNextPc(): number | null {
		if (this._nextThread >= this._numScheduledPcs) {
			return null;
		}
		return this._scheduledPcs[this._nextThread++];
	}

	public reset(): void {
		this._numScheduledPcs = 0;
		this._nextThread = 0;
		this._badnessByPc.fill(0);
	}
}
