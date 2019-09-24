## API Report File for "whynot"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

// @public
export class Assembler<TInput, TRecord, TOptions = void> {
    accept(): Instruction<TInput, TRecord, TOptions>;
    bad(cost?: number): Instruction<TInput, TRecord, TOptions>;
    // Warning: (ae-forgotten-export) The symbol "FailFunc" needs to be exported by the entry point index.d.ts
    fail(predicate?: FailFunc<TOptions>): Instruction<TInput, TRecord, TOptions>;
    jump(targets: number[]): Instruction<TInput, TRecord, TOptions>;
    // Warning: (ae-forgotten-export) The symbol "Instruction" needs to be exported by the entry point index.d.ts
    // 
    // (undocumented)
    readonly program: Instruction<TInput, TRecord, TOptions>[];
    // Warning: (ae-forgotten-export) The symbol "RecordFunc" needs to be exported by the entry point index.d.ts
    record<TRecorder>(data: TRecorder extends undefined ? TRecord : any, recorder?: RecordFunc<TRecord, TOptions>): Instruction<TInput, TRecord, TOptions>;
    // Warning: (ae-forgotten-export) The symbol "TestFunc" needs to be exported by the entry point index.d.ts
    test(matcher: TestFunc<TInput, TOptions>, data?: any): Instruction<TInput, TRecord, TOptions>;
}

// @public
export function compileVM<TInput, TRecord = void, TOptions = void>(compile: (assembler: Assembler<TInput, TRecord, TOptions>) => void): VM<TInput, TRecord, TOptions>;

// @public (undocumented)
const _default: {
    Assembler: typeof Assembler;
    VM: typeof VM;
    compileVM: typeof compileVM;
};

export default _default;

// @public
export class VM<TInput, TRecord, TOptions = void> {
    constructor(program: Instruction<TInput, TRecord, TOptions>[]);
    // Warning: (ae-forgotten-export) The symbol "Result" needs to be exported by the entry point index.d.ts
    execute(input: TInput[], options?: TOptions): Result<TRecord>;
    }


// (No @packageDocumentation comment for this package)

```