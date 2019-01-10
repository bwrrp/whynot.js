export type LazySet<T> = null | T | T[];

export function addToLazySet<T>(set: LazySet<T>, item: T): LazySet<T> {
	if (set === null) {
		return item;
	}
	if (Array.isArray(set)) {
		if (set.indexOf(item) === -1) {
			set.push(item);
		}
		return set;
	}
	if (set === item) {
		return set;
	}
	return [set, item];
}

export function mergeLazySets<T>(set1: LazySet<T>, set2: LazySet<T>): LazySet<T> {
	if (set1 === null) {
		return set2;
	}
	if (set2 === null) {
		return set1;
	}
	if (Array.isArray(set2)) {
		return set2.reduce((set: LazySet<T>, item: T) => addToLazySet(set, item), set1);
	}
	return addToLazySet(set1, set2);
}
