export type FailFunc<TOptions = void> = (options?: TOptions) => boolean;
export type TestFunc<TInput, TOptions = void> = (
	inputItem: TInput,
	data: any,
	options?: TOptions
) => boolean;
export type RecordFunc<TRecord, TOptions = void> = (
	data: any,
	inputIndex: number,
	options?: TOptions
) => TRecord | null | undefined;

/**
 * Represents the type of operation to perform.
 */
export const enum Operation {
	/**
	 * Accept the current trace if all of the input has been processed.
	 */
	ACCEPT,
	/**
	 * Increase the badness value of the current thread.
	 */
	BAD,
	/**
	 * Stop executing the current thread (possibly conditional).
	 */
	FAIL,
	/**
	 * Continue the thread at (or fork it to) one or more other places.
	 */
	JUMP,
	/**
	 * Add a record to all traces that pass this instruction.
	 */
	RECORD,
	/**
	 * Check the input item using a callback, and only continue the thread for the next input item
	 * if it returns true.
	 */
	TEST
}

/**
 * Represents a single instruction in a whynot program.
 */
export interface Instruction<TInput, TRecord, TOptions = void> {
	op: Operation;
	func?: FailFunc<TOptions> | TestFunc<TInput, TOptions> | RecordFunc<TRecord, TOptions> | null;
	data?: any;
}
