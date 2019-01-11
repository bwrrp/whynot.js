/**
 * A Trace represents the execution history of a Thread
 */
export default class Trace<TRecord> {
	constructor(public prefixes: Trace<TRecord>[], public record: TRecord | null) {}

	static EMPTY = new Trace<any>([], null);
}
