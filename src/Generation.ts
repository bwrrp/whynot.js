/**
 * Perform a binary search to find the index of the first thread with lower badness, within the
 * given bounds.
 *
 * This can then be the index at which to insert a new pc while preserving ordering according to
 * badness.
 *
 * @param pcs         - The array of scheduled pcs to search.
 * @param badnessByPc - Provides the current badness value for each pc in the array.
 * @param badness     - The badness to compare to (i.e., the value for the pc to be inserted).
 * @param first       - First index in pcs to consider.
 * @param length      - The length of the sub-array of pcs to consider. Also the highest index that
 *                      can be returned by this function.
 */
function findInsertionIndex(
	pcs: Uint16Array,
	badnessByPc: Uint8Array,
	badness: number,
	first: number,
	length: number
): number {
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
 * The highest supported badness value. Attempts to set badness higher than this are clamped to this
 * value.
 */
const MAX_BADNESS = 255;

/**
 * Schedules threads within a Generation according to their associated badness.
 */
export default class Generation {
	// Program counters of scheduled threads in order of execution
	private readonly _scheduledPcs: Uint16Array;
	private _numScheduledPcs: number = 0;

	// Index of the next thread to execute in the array above
	private _nextThread: number = 0;

	// Badness values for scheduled threads by program counter
	private readonly _badnessByPc: Uint8Array;

	constructor(programLength: number) {
		this._scheduledPcs = new Uint16Array(programLength);
		this._badnessByPc = new Uint8Array(programLength);
	}

	public getBadness(pc: number): number {
		return this._badnessByPc[pc];
	}

	/**
	 * Adds a new entry for pc to the scheduled pcs.
	 *
	 * The caller should ensure that pc is not already scheduled.
	 *
	 * @param pc      The pc to add
	 * @param badness The badness to associate with pc
	 */
	public add(pc: number, badness: number): void {
		this._badnessByPc[pc] = badness > MAX_BADNESS ? MAX_BADNESS : badness;
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

	/**
	 * Reschedule an already scheduled pc according to a new badness value.
	 *
	 * The caller should ensure this is only called for pcs that have already been scheduled.
	 *
	 * @param pc      The pc to reschedule
	 * @param badness The new badness to associate with pc
	 */
	public reschedule(pc: number, badness: number): void {
		const maxBadness = Math.max(
			this._badnessByPc[pc],
			badness > MAX_BADNESS ? MAX_BADNESS : badness
		);
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

	/**
	 * Get the next scheduled pc.
	 *
	 * This pc will have the lowest badness among all currently scheduled pcs.
	 *
	 * Returns null if there are no more scheduled pcs in this Generation.
	 */
	public getNextPc(): number | null {
		if (this._nextThread >= this._numScheduledPcs) {
			return null;
		}
		return this._scheduledPcs[this._nextThread++];
	}

	/**
	 * Clear all scheduled pcs and badness values so the Generation can be reused.
	 */
	public reset(): void {
		this._numScheduledPcs = 0;
		this._nextThread = 0;
		this._badnessByPc.fill(0);
	}
}
