export type FailFunc<TOptions = void> = (options?: TOptions) => boolean;
export type TestFunc<TInput, TOptions = void> = (
	inputItem: TInput,
	data: any,
	options?: TOptions
) => boolean;
export type RecordFunc<TOptions = void> = (
	data: any,
	inputIndex: number,
	options?: TOptions
) => any | null;

export enum Operation {
	ACCEPT,
	BAD,
	FAIL,
	JUMP,
	RECORD,
	TEST
}

/**
 * Represents a single instruction in a whynot program.
 */
export interface Instruction<TInput, TOptions = void> {
	op: Operation;
	func?: FailFunc<TOptions> | TestFunc<TInput, TOptions> | RecordFunc<TOptions> | null;
	data?: any;
}
