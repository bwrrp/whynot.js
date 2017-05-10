import { Instruction, FailFunc, TestFunc, RecordFunc } from './Instruction';

function addInstruction<I, O> (program: Instruction<I, O>[], op: string, func: FailFunc<O> | TestFunc<I, O> | RecordFunc<O> | null, data: any): Instruction<I, O> {
	const instruction = { op, func, data };
	program.push(instruction);
	return instruction;
}

function defaultRecorder (data: any, _inputIndex: number) {
	return data;
}

/**
 * The Assembler is used to generate a whynot program by appending instructions.
 */
export default class Assembler<I, O = void> {
	program: Instruction<I, O>[] = [];

	/**
	 * The 'test' instruction validates and consumes an input item.
	 * 
	 * If the matcher returns true, execution continues in the next Generation, otherwise execution of the current 
	 * Thread ends.
	 *
	 * @param matcher Callback to invoke for the input, should return true to accept, false to reject.
	 * @param data    Data to be passed to the matcher callback. Defaults to null.
	 *
	 * @return The new instruction
	 */
	test (matcher: TestFunc<I, O>, data?: any): Instruction<I, O> {
		return addInstruction(
			this.program,
			'test',
			matcher,
			data === undefined ? null : data
		);
	}

	/**
	 * The 'jump' instruction continues execution in the current Generation at any number of other locations. A new 
	 * Thread will be spawned for each target.
	 *
	 * @param targets Program counters at which to continue execution
	 * 
	 * @return The new instruction
	 */
	jump (targets: number[]): Instruction<I, O> {
		return addInstruction(
			this.program,
			'jump',
			null,
			targets
		);
	}

	/**
	 * The 'record' instruction adds a custom record to the current Thread's trace and resumes execution at the next 
	 * instruction in the same Generation.
	 *
	 * @param data     Data to record
	 * @param recorder Callback to generate the record based on data and the current input position. Defaults to 
	 *                   recording data.
	 *
	 * @return The new instruction
	 */
	record (data: any, recorder: RecordFunc<O> = defaultRecorder): Instruction<I, O> {
		return addInstruction(
			this.program,
			'record',
			recorder,
			data
		);
	}

	/**
	 * The 'bad' instruction permanently lowers the priority of all threads originating in the current one.
	 *
	 * @param cost Amount to increase badness with. Defaults to 1.
	 * 
	 * @return The new instruction
	 */
	bad (cost: number = 1): Instruction<I, O> {
		return addInstruction(
			this.program,
			'bad',
			null,
			cost
		);
	}

	/**
	 * The 'accept' instruction causes the VM to yield the current Thread's Trace upon completion, provided all input 
	 * has been consumed. Otherwise, the Thread ends.
	 *
	 * @return The new instruction
	 */
	accept (): Instruction<I, O> {
		return addInstruction(
			this.program,
			'accept',
			null,
			null
		);
	}

	/**
	 * The 'fail' instruction ends the current Thread.
	 *
	 * @param predicate Optional callback to make the fail conditional, if this returns true the thread will end, 
	 *                    otherwise it will continue.
	 * 
	 * @return The new instruction
	 */
	fail (predicate?: FailFunc<O>): Instruction<I, O> {
		return addInstruction<I, O>(
			this.program,
			'fail',
			predicate || null,
			null
		);
	}
}
