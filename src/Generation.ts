function findInsertionIndex(pcs: number[], badnessByPc: number[], badness: number, first: number) {
	// Perform a binary search to find the index of the first thread with lower badness
	let low = first;
	let high = pcs.length;
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
	private _scheduledPcs: number[] = [];

	// Index of the next thread to execute in the array above
	private _nextThread: number = 0;

	// Badness values for scheduled threads by program counter
	private _badnessByPc: number[] = [];

	constructor(programLength: number) {
		for (let i = 0; i < programLength; ++i) {
			this._badnessByPc.push(0);
		}
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
			this._nextThread
		);
		this._scheduledPcs.splice(insertionIndex, 0, pc);
	}

	public reschedule(pc: number, badness: number): void {
		const maxBadness = Math.max(this._badnessByPc[pc], badness);
		if (this._badnessByPc[pc] !== maxBadness) {
			// Remove any existing unexecuted thread in order to reschedule it
			const existingThreadIndex = this._scheduledPcs.indexOf(pc, this._nextThread);
			if (existingThreadIndex < 0) {
				this._badnessByPc[pc] = maxBadness;
				// Thread has already been executed, do not reschedule
				return;
			}

			// Remove and re-schedule the thread
			this._scheduledPcs.splice(existingThreadIndex, 1);
			this.add(pc, maxBadness);
		}
	}

	public getNextPc(): number | null {
		if (this._nextThread >= this._scheduledPcs.length) {
			return null;
		}
		return this._scheduledPcs[this._nextThread++];
	}

	public reset(): void {
		this._scheduledPcs.length = 0;
		this._nextThread = 0;
		this._badnessByPc.fill(0);
	}
}
