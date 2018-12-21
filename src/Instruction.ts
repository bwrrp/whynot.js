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

/**
 * Represents a single instruction in a whynot program.
 */
export interface Instruction<TInput, TOptions = void> {
	op: string;
	func?: FailFunc<TOptions> | TestFunc<TInput, TOptions> | RecordFunc<TOptions> | null;
	data?: any;
}
