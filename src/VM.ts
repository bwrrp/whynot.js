import { Instruction, FailFunc, RecordFunc, TestFunc } from './Instruction';
import Result from './Result';
import Scheduler from './Scheduler';
import Thread from './Thread';

const NUMBER_OF_SCHEDULED_GENERATIONS = 2;

/**
 * A virtual machine to execute whynot programs.
 */
export default class VM<I, O = void> {
	private _program: Instruction<I, O>[];
	private _schedulers: Scheduler[] = [];
	private _nextFreeScheduler: number = 0;
	private _oldThreadList: Thread[];

    /**
	 * @param program       The program to run, as created by the Assembler
	 * @param oldThreadList Array used for recycling Thread objects. An existing array can be passed in to share 
	 *                        recycled threads between VMs.
	 */
	constructor (program: Instruction<I, O>[], oldThreadList: Thread[] = []) {
		this._program = program;

		// Use multiple schedulers to make the VM reentrant. This way, one can implement recursion by executing a VM
		// inside a test, fail or record callback.
		this._schedulers = [];
		this._nextFreeScheduler = 0;
		this._oldThreadList = oldThreadList;
	}

	private _getScheduler (): Scheduler {
		let scheduler;
		if (this._nextFreeScheduler < this._schedulers.length) {
			scheduler = this._schedulers[this._nextFreeScheduler];
		} 
		else {
			scheduler = new Scheduler(
				NUMBER_OF_SCHEDULED_GENERATIONS,
				this._program.length,
				this._oldThreadList
			);
			this._schedulers.push(scheduler);
		}
		++this._nextFreeScheduler;
		return scheduler;
	}

	private _releaseScheduler () {
		--this._nextFreeScheduler;
	}

	/**
	 * Executes the program in the VM with the given input stream.
	 *
	 * @param input   Should return the next input item when called, or null when no further input is available.
	 * @param options Optional object passed to all instruction callbacks.
	 *
	 * @return Result of the execution, containing all Traces that lead to acceptance of the input, and all traces 
	 *           which lead to failure in the last Generation.
	 */
	execute (input: () => I | null, options?: O) {
		const scheduler = this._getScheduler();
		const program = this._program;

		// Reset the scheduler
		scheduler.reset();

		// Add initial thread
		scheduler.addThread(0, 0);

		const acceptingTraces = [];
		const failingTraces = [];
		let inputIndex = -1;
		let inputItem: I | null;
		do {
			// Get next thread to execute
			let thread = scheduler.getNextThread();
			if (!thread) {
				break;
			}

			// We only record failing traces for the last active Generation
			failingTraces.length = 0;

			// Read next input item
			++inputIndex;
			inputItem = input();

			while (thread) {
				const instruction = program[thread.pc];

				switch (instruction.op) {
					case 'accept':
						// Only accept if we reached the end of the input
						if (inputItem === null || inputItem === undefined) {
							acceptingTraces.push(thread.trace);
						} 
						else {
							failingTraces.push(thread.trace);
						}
						break;

					case 'fail': {
						// Is the failure conditional?
                        const func = instruction.func as FailFunc<O>;
						const isFailingCondition = !func || func(options);
						if (isFailingCondition) {
							// Branch is forbidden, end the thread
							failingTraces.push(thread.trace);
							break;
						}
						// Condition failed, continue at next instruction
						scheduler.addThread(
							0,
							thread.pc + 1,
							thread,
							thread.badness
						);
						break;
					}

					case 'bad':
						// Continue at next pc with added badness
						scheduler.addThread(
							0,
							thread.pc + 1,
							thread,
							thread.badness + (instruction.data as number)
						);
						break;

					case 'test': {
						// Fail if out of input
						if (inputItem === null || inputItem === undefined) {
							failingTraces.push(thread.trace);
							break;
						}
						// Fail if input does not match
                        const func = instruction.func as TestFunc<I, O>;
						const isInputAccepted = func(inputItem, instruction.data, options);
						if (!isInputAccepted) {
							failingTraces.push(thread.trace);
							break;
						}
						// Continue in next generation, preserving badness
						scheduler.addThread(
							1,
							thread.pc + 1,
							thread,
							thread.badness
						);
						break;
					}

					case 'jump': {
						// Spawn new threads for all targets
						for (let iTarget = 0, nTargets = instruction.data.length; iTarget < nTargets; ++iTarget) {
							scheduler.addThread(
								0,
								instruction.data[iTarget],
								thread,
								thread.badness
							);
						}
						break;
					}

					case 'record': {
						// Invoke record callback
						const func = instruction.func as RecordFunc<O>;
						const record = func(instruction.data, inputIndex, options);
						if (record !== null && record !== undefined) {
							thread.trace.records.push(record);
						}
						// Continue with next instruction
						scheduler.addThread(
							0,
							thread.pc + 1,
							thread,
							thread.badness
						);
						break;
					}
				}

				// Next thread
				thread = scheduler.getNextThread();
			}

			// End current Generation and continue with the next. This compacts the Traces in the old Generation.
			scheduler.nextGeneration();
		} while (inputItem !== null && inputItem !== undefined);

		// Release the scheduler
		this._releaseScheduler();

		return new Result(acceptingTraces, failingTraces);
	}
}
