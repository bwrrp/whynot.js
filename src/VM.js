/**
 * @module whynot
 */
define(
	[
		'./Scheduler',
		'./Result'
	],
	function(
		Scheduler,
		Result
		) {
		'use strict';

		var NUMBER_OF_SCHEDULED_GENERATIONS = 2;

		/**
		 * A virtual machine to execute whynot programs.
		 *
		 * @class VM
		 * @constructor
		 *
		 * @param {Array}    program         The program to run, as created by the Assembler
		 * @param {Thread[]} [oldThreadList] Array used for recycling Thread objects. An existing
		 *                                     array can be passed in to share recycled threads
		 *                                     between VMs.
		 */
		function VM(program, oldThreadList) {
			this._program = program;

			// Use multiple schedulers to make the VM reentrant. This way, one can implement
			// recursion by executing a VM inside a test, fail or record callback.
			this._schedulers = [];
			this._nextFreeScheduler = 0;
			this._oldThreadList = oldThreadList || [];
		}

		function getScheduler(vm) {
			var scheduler;
			if (vm._nextFreeScheduler < vm._schedulers.length) {
				scheduler = vm._schedulers[vm._nextFreeScheduler];
			} else {
				scheduler = new Scheduler(
					NUMBER_OF_SCHEDULED_GENERATIONS,
					vm._program.length,
					vm._oldThreadList);
				vm._schedulers.push(scheduler);
			}
			++vm._nextFreeScheduler;
			return scheduler;
		}

		function releaseScheduler(vm) {
			--vm._nextFreeScheduler;
		}

		/**
		 * Executes the program in the VM with the given input stream.
		 *
		 * @method execute
		 *
		 * @param {Function} input     Should return the next input item when called,
		 *                               or null when no further input is available.
		 * @param {Object}   [options] Optional object passed to all instruction callbacks.
		 *
		 * @return {Result} Result of the execution, containing all Traces that lead to acceptance
		 *                    of the input, and all traces which lead to failure in the last
		 *                    Generation.
		 */
		VM.prototype.execute = function(input, options) {
			var scheduler = getScheduler(this),
				program = this._program;

			// Reset the scheduler
			scheduler.reset();

			// Add initial thread
			scheduler.addThread(0, 0);

			var acceptingTraces = [],
				failingTraces = [],
				inputIndex = -1,
				inputItem;
			do {
				// Get next thread to execute
				var thread = scheduler.getNextThread();
				if (!thread) {
					break;
				}

				// We only record failing traces for the last active Generation
				failingTraces.length = 0;

				// Read next input item
				++inputIndex;
				inputItem = input();

				while (thread) {
					var instruction = program[thread.pc];

					switch (instruction.op) {
						case 'accept':
							// Only accept if we reached the end of the input
							if (!inputItem) {
								acceptingTraces.push(thread.trace);
							} else {
								failingTraces.push(thread.trace);
							}
							break;

						case 'fail':
							// Is the failure conditional?
							var isFailingCondition = !instruction.func ||
									instruction.func.call(undefined, options);
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
								thread.badness);
							break;

						case 'bad':
							// Continue at next pc with added badness
							scheduler.addThread(
								0,
								thread.pc + 1,
								thread,
								thread.badness + instruction.data);
							break;

						case 'test':
							// Fail if out of input
							if (!inputItem) {
								failingTraces.push(thread.trace);
								break;
							}
							// Fail if input does not match
							var isInputAccepted = instruction.func.call(undefined,
									inputItem, instruction.data, options);
							if (!isInputAccepted) {
								failingTraces.push(thread.trace);
								break;
							}
							// Continue in next generation, preserving badness
							scheduler.addThread(
								1,
								thread.pc + 1,
								thread,
								thread.badness);
							break;

						case 'jump':
							// Spawn new threads for all targets
							for (var iTarget = 0, nTargets = instruction.data.length; iTarget < nTargets; ++iTarget) {
								scheduler.addThread(
									0,
									instruction.data[iTarget],
									thread,
									thread.badness);
							}
							break;

						case 'record':
							// Invoke record callback
							var record = instruction.func.call(undefined,
									instruction.data, inputIndex, options);
							if (record) {
								thread.trace.records.push(record);
							}
							// Continue with next instruction
							scheduler.addThread(
								0,
								thread.pc + 1,
								thread,
								thread.badness);
							break;
					}

					// Next thread
					thread = scheduler.getNextThread();
				}

				// End current Generation and continue with the next
				// This automatically compacts the Traces in the old Generation
				scheduler.nextGeneration();
			} while (inputItem);

			// Release the scheduler
			releaseScheduler(this);

			return new Result(acceptingTraces, failingTraces);
		};

		return VM;
	}
);
