export type LazySet<T> = null | T | T[];

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