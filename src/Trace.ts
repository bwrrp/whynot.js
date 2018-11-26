/**
 * A Trace represents the execution history of a Thread
 */
export default class Trace {
	constructor(public prefixes: Trace[], public records: any[] | null) {}

	static EMPTY = new Trace([], null);
}
