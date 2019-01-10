import FromBuffer from '../src/FromBuffer';

describe('FromBuffer', () => {
	function toArray(fromBuffer: FromBuffer, toPc: number): number[] {
		const result: number[] = [];
		fromBuffer.forEach(toPc, fromPc => result.push(fromPc));
		return result;
	}

	it('can efficiently store multiple from arrays in a single typed array', () => {
		const maxFromByPc = [1, 2, 3, 0, 2];
		const buffer = new FromBuffer(maxFromByPc);

		expect(buffer.has(0)).toBe(false);
		expect(buffer.has(1)).toBe(false);
		expect(buffer.has(2)).toBe(false);
		expect(buffer.has(3)).toBe(false);
		expect(buffer.has(4)).toBe(false);

		buffer.add(123, 0);

		expect(buffer.has(0)).toBe(true);
		expect(buffer.has(1)).toBe(false);
		expect(buffer.has(2)).toBe(false);
		expect(buffer.has(3)).toBe(false);
		expect(buffer.has(4)).toBe(false);

		buffer.add(111, 1);
		buffer.add(1111, 1);
		buffer.add(22, 2);
		buffer.add(222, 2);
		buffer.add(2222, 2);
		buffer.add(44, 4);
		buffer.add(444, 4);

		expect(buffer.has(0)).toBe(true);
		expect(buffer.has(1)).toBe(true);
		expect(buffer.has(2)).toBe(true);
		expect(buffer.has(3)).toBe(false);
		expect(buffer.has(4)).toBe(true);

		expect(toArray(buffer, 0)).toEqual([123]);
		expect(toArray(buffer, 1)).toEqual([111, 1111]);
		expect(toArray(buffer, 2)).toEqual([22, 222, 2222]);
		expect(toArray(buffer, 3)).toEqual([]);
		expect(toArray(buffer, 4)).toEqual([44, 444]);
	});
});
