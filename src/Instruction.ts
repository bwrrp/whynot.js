export type FailFunc<O = void> = (options?: O) => boolean;
export type TestFunc<O = void> = (inputItem: any, data: any, options?: O) => boolean;
export type RecordFunc<O = void> = (data: any, inputIndex: number, options?: O) => any | null;

/**
 * Represents a single instruction in a whynot program.
 */
export interface Instruction<O = void> {
    op: string,
    func?: FailFunc<O> | TestFunc<O> | RecordFunc<O> | null,
    data?: any
}
