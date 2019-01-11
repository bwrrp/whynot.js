export default class FromBuffer {
	private readonly _buffer: Uint16Array;
	private readonly _mapping: number[] = [];

	constructor(maxFromByPc: number[]) {
		let offset = maxFromByPc.length;
		maxFromByPc.forEach(max => {
			this._mapping.push(max > 0 ? offset : -1);
			offset += max;
		});

		// Allocate enough room for lengths and elements
		this._buffer = new Uint16Array(offset);
	}

	public clear(): void {
		this._buffer.fill(0, 0, this._mapping.length);
	}

	public add(fromPc: number, toPc: number): void {
		const length = this._buffer[toPc];
		const offset = this._mapping[toPc];
		this._buffer[toPc] += 1;
		this._buffer[offset + length] = fromPc;
	}

	public has(toPc: number): boolean {
		const length = this._buffer[toPc];
		return length > 0;
	}

	public forEach(toPc: number, callback: (fromPc: number) => void): void {
		const length = this._buffer[toPc];
		const offset = this._mapping[toPc];
		for (let i = offset; i < offset + length; ++i) {
			callback(this._buffer[i]);
		}
	}
}
