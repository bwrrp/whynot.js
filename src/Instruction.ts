export type FailFunc<O = void> = (options?: O) => boolean;
export type TestFunc<I, O = void> = (inputItem: I, data: any, options?: O) => boolean;
export type RecordFunc<O = void> = (data: any, inputIndex: number, options?: O) => any | null;

/**
 * Represents a single instruction in a whynot program.
 */
export interface Instruction<I, O = void> {
    op: string,
    func?: FailFunc<O> | TestFunc<I, O> | RecordFunc<O> | null,
    data?: any
}
