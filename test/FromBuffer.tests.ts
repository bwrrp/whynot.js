import FromBuffer from '../src/FromBuffer';

describe('FromBuffer', () => {
	function toArray(fromBuffer: FromBuffer, toPc: number): number[] {
		const result: number[] = [];
		fromBuffer.forEach(toPc, fromPc => result.push(fromPc));
		return result;
	}

	it('can efficiently store multiple from arrays in a single typed array', () => {
		const maxFromByPc = [1, 2, 3];
		const buffer = new FromBuffer(maxFromByPc);

		expect(buffer.has(0)).toBe(false);
		expect(buffer.has(1)).toBe(false);
		expect(buffer.has(2)).toBe(false);

		buffer.push(123, 0);

		expect(buffer.has(0)).toBe(true);
		expect(buffer.has(1)).toBe(false);
		expect(buffer.has(2)).toBe(false);

		buffer.push(456, 1);
		buffer.push(789, 2);
		buffer.push(111, 2);

		expect(buffer.has(0)).toBe(true);
		expect(buffer.has(1)).toBe(true);
		expect(buffer.has(2)).toBe(true);

		expect(toArray(buffer, 0)).toEqual([123]);
		expect(toArray(buffer, 1)).toEqual([456]);
		expect(toArray(buffer, 2)).toEqual([789, 111]);
	});
});
