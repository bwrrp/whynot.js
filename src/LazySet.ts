/**
 * Represents a lazily-allocated Set-like datatype.
 *
 * Allocating actual sets during tracing is quite expensive, especially given that in the vast
 * majority of cases these sets will only consist of zero or one item. This simply represents those
 * cases as null or the item itself respectively, avoiding allocation until the set contains two or
 * more items.
 */
export type LazySet<T> = null | T | T[];

/**
 * Returns the LazySet resulting from adding an item to the given LazySet.
 *
 * If item is already in set, always returns set.
 *
 * @param set            - The LazySet to add the item to
 * @param item           - The item to add
 * @param setIsImmutable - If left at false, when set is an array, item is pushed into the existing
 *                         array. If set to true, a new array will be allocated instead. This can be
 *                         used to prevent mutation of an existing set if you need to keep the
 *                         original value.
 */
export function addToLazySet<T>(
	set: LazySet<T>,
	item: T,
	setIsImmutable: boolean = false
): LazySet<T> {
	if (set === null) {
		return item;
	}
	if (Array.isArray(set)) {
		if (set.indexOf(item) === -1) {
			if (setIsImmutable) {
				set = set.slice();
			}
			set.push(item);
		}
		return set;
	}
	if (set === item) {
		return set;
	}
	return [set, item];
}

/**
 * Returns a LazySet representing the union of the given sets.
 *
 * @param set1            - First set
 * @param set2            - Second set
 * @param setIsImmutable - If left at false, when set1 is an array, items in set2 are pushed into
 *                         the existing array. If set to true, a new array will be allocated
 *                         instead. This can be used to prevent mutation of an existing set if you
 *                         need to keep the original value.
 */
export function mergeLazySets<T>(
	set1: LazySet<T>,
	set2: LazySet<T>,
	set1IsImmutable: boolean
): LazySet<T> {
	if (set1 === null) {
		return set2;
	}
	if (set2 === null) {
		return set1;
	}
	if (Array.isArray(set2)) {
		return set2.reduce(
			(set: LazySet<T>, item: T) => addToLazySet(set, item, set === set2),
			set1
		);
	}
	return addToLazySet(set1, set2, set1IsImmutable);
}
