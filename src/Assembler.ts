import { Instruction, FailFunc, TestFunc, RecordFunc, Operation } from './Instruction';

function addInstruction<TInput, TRecord, TOptions>(
	program: Instruction<TInput, TRecord, TOptions>[],
	op: Operation,
	func: FailFunc<TOptions> | TestFunc<TInput, TOptions> | RecordFunc<TRecord, TOptions> | null,
	data: any
): Instruction<TInput, TRecord, TOptions> {
	const instruction = { op, func, data };
	program.push(instruction);
	return instruction;
}

function defaultRecorder<TRecord>(data: TRecord, _inputIndex: number): TRecord {
	return data;
}

/**
 * The Assembler is used to generate a whynot program by appending instructions.
 */
export default class Assembler<TInput, TRecord, TOptions = void> {
	program: Instruction<TInput, TRecord, TOptions>[] = [];

	/**
	 * The 'test' instruction validates and consumes an input item.
	 *
	 * If the matcher returns true, execution continues in the next Generation, otherwise execution
	 * of the current Thread ends.
	 *
	 * @param matcher Callback to invoke for the input, should return true to accept, false to
	 *                reject.
	 * @param data    Data to be passed to the matcher callback. Defaults to null.
	 *
	 * @return The new instruction
	 */
	test(matcher: TestFunc<TInput, TOptions>, data?: any): Instruction<TInput, TRecord, TOptions> {
		return addInstruction(
			this.program,
			Operation.TEST,
			matcher,
			data === undefined ? null : data
		);
	}

	/**
	 * The 'jump' instruction continues execution in the current Generation at any number of other
	 * locations. A new Thread will be spawned for each target.
	 *
	 * @param targets Program counters at which to continue execution
	 *
	 * @return The new instruction
	 */
	jump(targets: number[]): Instruction<TInput, TRecord, TOptions> {
		return addInstruction(this.program, Operation.JUMP, null, targets);
	}

	/**
	 * The 'record' instruction adds a custom record to the current Thread's trace and resumes
	 * execution at the next instruction in the same Generation.
	 *
	 * @param data     Data to record
	 * @param recorder Callback to generate the record based on data and the current input position.
	 *                 Defaults to recording data.
	 *
	 * @return The new instruction
	 */
	record<TRecorder>(
		data: TRecorder extends undefined ? TRecord : any,
		recorder?: RecordFunc<TRecord, TOptions>
	): Instruction<TInput, TRecord, TOptions> {
		return addInstruction(
			this.program,
			Operation.RECORD,
			recorder === undefined ? defaultRecorder : recorder,
			data
		);
	}

	/**
	 * The 'bad' instruction permanently lowers the priority of all threads originating in the
	 * current one.
	 *
	 * @param cost Amount to increase badness with. Defaults to 1.
	 *
	 * @return The new instruction
	 */
	bad(cost: number = 1): Instruction<TInput, TRecord, TOptions> {
		return addInstruction(this.program, Operation.BAD, null, cost);
	}

	/**
	 * The 'accept' instruction causes the VM to yield the current Thread's Trace upon completion,
	 * provided all input has been consumed. Otherwise, the Thread ends.
	 *
	 * @return The new instruction
	 */
	accept(): Instruction<TInput, TRecord, TOptions> {
		return addInstruction(this.program, Operation.ACCEPT, null, null);
	}

	/**
	 * The 'fail' instruction ends the current Thread.
	 *
	 * @param predicate Optional callback to make the fail conditional, if this returns true the
	 *                  thread will end, otherwise it will continue.
	 *
	 * @return The new instruction
	 */
	fail(predicate?: FailFunc<TOptions>): Instruction<TInput, TRecord, TOptions> {
		return addInstruction(this.program, Operation.FAIL, predicate || null, null);
	}
}
