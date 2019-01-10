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
		it('Adds all items in the second set to the first', () => {
			expect(mergeLazySets(null, null)).toBe(null);
			expect(mergeLazySets(null, 1)).toBe(1);
			expect(mergeLazySets(1, null)).toBe(1);
			expect(mergeLazySets(1, 1)).toBe(1);
			expect(mergeLazySets(1, 2)).toEqual([1, 2]);
			expect(mergeLazySets([1, 2], null)).toEqual([1, 2]);
			expect(mergeLazySets(null, [1, 2])).toEqual([1, 2]);
			expect(mergeLazySets(1, [1, 2, 3])).toEqual([1, 2, 3]);
			expect(mergeLazySets(1, [2, 3])).toEqual([1, 2, 3]);
			expect(mergeLazySets([1, 2], null)).toEqual([1, 2]);
			expect(mergeLazySets([1, 2, 3], 1)).toEqual([1, 2, 3]);
			expect(mergeLazySets([2, 3], 1)).toEqual([2, 3, 1]);
			expect(mergeLazySets([1, 2], [3, 4])).toEqual([1, 2, 3, 4]);
		});

		it('Mutates the first set if it was already an array', () => {
			const values = [1, 2, 3];
			addToLazySet(values, 4);
			expect(values).toEqual([1, 2, 3, 4]);
		});

		it('Does not add duplicates', () => {
			expect(mergeLazySets([1, 2, 3, 4, 5], [2, 4, 6, 8])).toEqual([1, 2, 3, 4, 5, 6, 8]);
		});
	});
});
