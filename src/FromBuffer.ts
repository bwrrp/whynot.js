/**
 * The FromBuffer efficiently stores an "array of arrays", which for each instruction index (pc or
 * "program counter") tracks the pcs from which steps arrived at that instruction.
 *
 * To prevent allocation during the runtime of the whynot program, this data is stored in a single
 * Uint16Array. This buffer is sized to be able to hold for each pc the maximum number of incoming
 * steps, as derived from the program by ProgramInfo, as well as the current lengths of the
 * sub-array for each pc. The lower programLength entries contain these lengts, while the _mapping
 * array provides the offset at which each pcs data starts.
 */
export default class FromBuffer {
	private readonly _buffer: Uint16Array;
	private readonly _mapping: number[] = [];

	/**
	 * @param maxFromByPc - The maximum number of entries to reserve for each pc.
	 */
	constructor(maxFromByPc: number[]) {
		let offset = maxFromByPc.length;
		maxFromByPc.forEach(max => {
			this._mapping.push(max > 0 ? offset : -1);
			offset += max;
		});

		// Allocate enough room for lengths and elements
		this._buffer = new Uint16Array(offset);
	}

	/**
	 * Clear the buffer.
	 *
	 * This only resets the lengths, as that will make the data for each pc inaccessible.
	 */
	public clear(): void {
		this._buffer.fill(0, 0, this._mapping.length);
	}

	/**
	 * Add an entry to the buffer.
	 *
	 * This method does not perform bounds checking, the caller should ensure no more entries are
	 * added for each toPc than the maximum provided to the constructor.
	 *
	 * @param fromPc - The entry to add (the pc this step came from).
	 * @param toPc   - The pc for which to add the entry.
	 */
	public add(fromPc: number, toPc: number): void {
		const length = this._buffer[toPc];
		const offset = this._mapping[toPc];
		this._buffer[toPc] += 1;
		this._buffer[offset + length] = fromPc;
	}

	/**
	 * Returns whether any entries have been added for the given pc.
	 *
	 * @param toPc - The pc to check entries for.
	 */
	public has(toPc: number): boolean {
		const length = this._buffer[toPc];
		return length > 0;
	}

	/**
	 * Iterates over the entries added for the given pc, (synchronously) invoking callback with the
	 * value of each entry.
	 *
	 * @param toPc     - The entry whose values should be iterated over.
	 * @param callback - Callback to invoke for each value.
	 */
	public forEach(toPc: number, callback: (fromPc: number) => void): void {
		const length = this._buffer[toPc];
		const offset = this._mapping[toPc];
		for (let i = offset; i < offset + length; ++i) {
			callback(this._buffer[i]);
		}
	}
}
