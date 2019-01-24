/**
 * A Trace represents the execution history of a Thread in terms of the records gathered. Only paths
 * that differ in terms of these records are preserved.
 *
 * Trace is never cyclic (i.e., a given Trace is never included in its prefixes, including,
 * recursively, the prefixes thereof).
 *
 * Trace instances are often reused and should therefore never be mutated after creation.
 */
export default class Trace<TRecord> {
	constructor(
		public readonly prefixes: Trace<TRecord>[],
		public readonly record: TRecord | null
	) {}

	/**
	 * Single instance used to represent the empty trace from which all programs start.
	 */
	static EMPTY = new Trace<any>([], null);
}
