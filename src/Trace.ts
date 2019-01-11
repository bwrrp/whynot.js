/**
 * A Trace represents the execution history of a Thread
 */
export default class Trace<TRecord> {
	constructor(public readonly prefixes: Trace<TRecord>[], public readonly record: TRecord | null) {}

	static EMPTY = new Trace<any>([], null);
}
