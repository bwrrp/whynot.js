import { addToLazySet, mergeLazySets } from '../src/LazySet';

describe('LazySet', () => {
	describe('addToLazySet()', () => {
		it('Adds an item, returning the appropriate set representation', () => {
			expect(addToLazySet(null, 1)).toBe(1);
			expect(addToLazySet(1, 2 as number)).toEqual([1, 2]);
			expect(addToLazySet([1, 2], 3)).toEqual([1, 2, 3]);
		});

		it('Does not add duplicate items', () => {
			expect(addToLazySet(1, 1)).toBe(1);
			expect(addToLazySet([1, 2], 2)).toEqual([1, 2]);
		});
	});

	describe('mergeLazySets()', () => {
		it('Adds all items in the second set to the first (mutable)', () => {
			expect(mergeLazySets(null, null, false)).toBe(null);
			expect(mergeLazySets(null, 1, false)).toBe(1);
			expect(mergeLazySets(1, null, false)).toBe(1);
			expect(mergeLazySets(1, 1, false)).toBe(1);
			expect(mergeLazySets(1, 2, false)).toEqual([1, 2]);
			expect(mergeLazySets([1, 2], null, false)).toEqual([1, 2]);
			expect(mergeLazySets(null, [1, 2], false)).toEqual([1, 2]);
			expect(mergeLazySets(1, [1, 2, 3], false)).toEqual([1, 2, 3]);
			expect(mergeLazySets(1, [2, 3], false)).toEqual([1, 2, 3]);
			expect(mergeLazySets([1, 2], null, false)).toEqual([1, 2]);
			expect(mergeLazySets([1, 2, 3], 1, false)).toEqual([1, 2, 3]);
			expect(mergeLazySets([2, 3], 1, false)).toEqual([2, 3, 1]);
			expect(mergeLazySets([1, 2], [3, 4], false)).toEqual([1, 2, 3, 4]);
		});

		it('Adds all items in the second set to the first (immutable)', () => {
			expect(mergeLazySets(null, null, true)).toBe(null);
			expect(mergeLazySets(null, 1, true)).toBe(1);
			expect(mergeLazySets(1, null, true)).toBe(1);
			expect(mergeLazySets(1, 1, true)).toBe(1);
			expect(mergeLazySets(1, 2, true)).toEqual([1, 2]);
			expect(mergeLazySets([1, 2], null, true)).toEqual([1, 2]);
			expect(mergeLazySets(null, [1, 2], true)).toEqual([1, 2]);
			expect(mergeLazySets(1, [1, 2, 3], true)).toEqual([1, 2, 3]);
			expect(mergeLazySets(1, [2, 3], true)).toEqual([1, 2, 3]);
			expect(mergeLazySets([1, 2], null, true)).toEqual([1, 2]);
			expect(mergeLazySets([1, 2, 3], 1, true)).toEqual([1, 2, 3]);
			expect(mergeLazySets([2, 3], 1, true)).toEqual([2, 3, 1]);
			expect(mergeLazySets([1, 2], [3, 4], true)).toEqual([1, 2, 3, 4]);
		});

		it('Mutates the first set if it was already an array that is mutable', () => {
			const values = [1, 2, 3];
			mergeLazySets(values, 4, false);
			expect(values).toEqual([1, 2, 3, 4]);
		});

		it('Does not mutate the first set if told it is immutable', () => {
			const values = [1, 2, 3];
			const merged = mergeLazySets(null, values, false);
			mergeLazySets(merged, 4, true);
			expect(values).toEqual([1, 2, 3]);
		});

		it('Does not add duplicates', () => {
			const expected = [1, 2, 3, 4, 5, 6, 8];
			expect(mergeLazySets([1, 2, 3, 4, 5], [2, 4, 6, 8], true)).toEqual(expected);
			expect(mergeLazySets([1, 2, 3, 4, 5], [2, 4, 6, 8], false)).toEqual(expected);
		});
	});
});
