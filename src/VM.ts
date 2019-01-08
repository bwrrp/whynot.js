import { Instruction, FailFunc, RecordFunc, TestFunc } from './Instruction';
import Result from './Result';
import Scheduler from './Scheduler';

/**
 * A virtual machine to execute whynot programs.
 */
export default class VM<TInput, TOptions = void> {
	private _program: Instruction<TInput, TOptions>[];
	private _schedulers: Scheduler[] = [];

	/**
	 * @param program       The program to run, as created by the Assembler
	 */
	constructor(program: Instruction<TInput, TOptions>[]) {
		this._program = program;
	}

	/**
	 * Executes the program in the VM with the given input stream.
	 *
	 * @param input   An array of input items.
	 * @param options Optional object passed to all instruction callbacks.
	 *
	 * @return Result of the execution, containing all Traces that lead to acceptance of the input
	 *         (if any)
	 */
	execute(input: TInput[], options?: TOptions): Result {
		const scheduler = this._schedulers.pop() || new Scheduler(this._program.length);

		// Add initial thread
		scheduler.reset();

		const inputLength = input.length;
		let inputIndex = -1;
		let inputItem: TInput | null;
		do {
			// Get next thread to execute
			let pc = scheduler.getNextThreadPc();
			if (pc === null) {
				break;
			}

			// Read next input item
			++inputIndex;
			inputItem = inputIndex >= inputLength ? null : input[inputIndex];

			while (pc !== null) {
				const instruction = this._program[pc];

				switch (instruction.op) {
					case 'accept':
						// Only accept if we reached the end of the input
						if (inputItem === null) {
							scheduler.accept(pc);
						} else {
							scheduler.fail(pc);
						}
						break;

					case 'fail': {
						// Is the failure conditional?
						const func = instruction.func as FailFunc<TOptions>;
						const isFailingCondition = !func || func(options);
						if (isFailingCondition) {
							// Branch is forbidden, end the thread
							scheduler.fail(pc);
							break;
						}
						// Condition failed, continue at next instruction
						scheduler.step(pc, pc + 1, 0);
						break;
					}

					case 'bad':
						// Continue at next pc with added badness
						scheduler.step(pc, pc + 1, instruction.data as number);
						break;

					case 'test': {
						// Fail if out of input
						if (inputItem === null) {
							scheduler.fail(pc);
							break;
						}
						// Fail if input does not match
						const func = instruction.func as TestFunc<TInput, TOptions>;
						const isInputAccepted = func(inputItem, instruction.data, options);
						if (!isInputAccepted) {
							scheduler.fail(pc);
							break;
						}
						// Continue in next generation, preserving badness
						scheduler.stepToNextGeneration(pc, pc + 1);
						break;
					}

					case 'jump': {
						// Spawn new threads for all targets
						const targetPcs = instruction.data as number[];
						const numTargets = targetPcs.length;
						if (numTargets === 0) {
							scheduler.fail(pc);
							break;
						}
						for (let i = 0; i < numTargets; ++i) {
							scheduler.step(pc, targetPcs[i], 0);
						}
						break;
					}

					case 'record': {
						// Invoke record callback
						const func = instruction.func as RecordFunc<TOptions>;
						const record = func(instruction.data, inputIndex, options);
						if (record !== null && record !== undefined) {
							scheduler.record(pc, record);
						}
						// Continue with next instruction
						scheduler.step(pc, pc + 1, 0);
						break;
					}
				}

				// Next thread
				pc = scheduler.getNextThreadPc();
			}

			// End current Generation and continue with the next
			scheduler.nextGeneration();
		} while (inputItem !== null);

		const result = new Result(scheduler.getAcceptingTraces());

		// Clear and recycle the scheduler
		scheduler.reset();
		this._schedulers.push(scheduler);

		return result;
	}
}
