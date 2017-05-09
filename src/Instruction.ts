export type FailFunc = (options?: object) => boolean;
export type TestFunc = (inputItem: any, data: any, options?: object) => boolean;
export type RecordFunc = (data: any, inputIndex: number, options?: object) => any | null;

export interface Instruction {
    op: string,
    func?: FailFunc | TestFunc | RecordFunc | null,
    data?: any
}
