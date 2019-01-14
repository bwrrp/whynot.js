// @public
class Assembler<TInput, TRecord, TOptions = void> {
  // WARNING: The type "Instruction" needs to be exported by the package (e.g. added to index.ts)
  accept(): Instruction<TInput, TRecord, TOptions>;
  // WARNING: The type "Instruction" needs to be exported by the package (e.g. added to index.ts)
  bad(cost?: number): Instruction<TInput, TRecord, TOptions>;
  // WARNING: The type "FailFunc" needs to be exported by the package (e.g. added to index.ts)
  // WARNING: The type "Instruction" needs to be exported by the package (e.g. added to index.ts)
  fail(predicate?: FailFunc<TOptions>): Instruction<TInput, TRecord, TOptions>;
  // WARNING: The type "Instruction" needs to be exported by the package (e.g. added to index.ts)
  jump(targets: number[]): Instruction<TInput, TRecord, TOptions>;
  // WARNING: The type "Instruction" needs to be exported by the package (e.g. added to index.ts)
  // (undocumented)
  readonly program: Instruction<TInput, TRecord, TOptions>[];
  // WARNING: The type "RecordFunc" needs to be exported by the package (e.g. added to index.ts)
  // WARNING: The type "Instruction" needs to be exported by the package (e.g. added to index.ts)
  record<TRecorder>(data: TRecorder extends undefined ? TRecord : any, recorder?: RecordFunc<TRecord, TOptions>): Instruction<TInput, TRecord, TOptions>;
  // WARNING: The type "TestFunc" needs to be exported by the package (e.g. added to index.ts)
  // WARNING: The type "Instruction" needs to be exported by the package (e.g. added to index.ts)
  test(matcher: TestFunc<TInput, TOptions>, data?: any): Instruction<TInput, TRecord, TOptions>;
}

// @public
export function compileVM<TInput, TRecord = void, TOptions = void>(compile: (assembler: Assembler<TInput, TRecord, TOptions>) => void): VM<TInput, TRecord, TOptions>;

// @public
class VM<TInput, TRecord, TOptions = void> {
  // WARNING: The type "Instruction" needs to be exported by the package (e.g. added to index.ts)
  constructor(program: Instruction<TInput, TRecord, TOptions>[]);
  // WARNING: The type "Result" needs to be exported by the package (e.g. added to index.ts)
  execute(input: TInput[], options?: TOptions): Result<TRecord>;
}

// WARNING: Unsupported export: default
// (No @packagedocumentation comment for this package)
