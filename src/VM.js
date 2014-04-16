/**
 * @module whynot
 */
define(
	[
		'./Scheduler'
	],
	function(
		Scheduler
		) {
		'use strict';

		/**
		 * A virtual machine to execute whynot programs.
		 *
		 * @class VM
		 * @constructor
		 *
		 * @param {Array} program The program to run, as created by the Assembler
		 */
		function VM(program) {
			this._program = program;
			this._scheduler = new Scheduler(2, program.length);
		}

		/**
		 * Executes the program in the VM with the given input stream.
		 *
		 * @method execute
		 *
		 * @param {Function} input Should return the next input item when called,
		 *                           or null when no further input is available.
		 *
		 * @return {Trace[]} All Traces which lead to acceptance of the input stream 
		 */
		VM.prototype.execute = function(input) {
			var scheduler = this._scheduler,
				program = this._program;

			// Reset the scheduler
			scheduler.reset();

			// Add initial thread
			scheduler.addThread(0, 0);

			var acceptingTraces = [],
				inputIndex = -1,
				inputItem;
			do {
				// Get next thread to execute
				var thread = scheduler.getNextThread();
				if (!thread) {
					break;
				}

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
							}
							break;

						case 'fail':
							// Branch is forbidden, end the thread
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
								break;
							}
							// Fail if input does not match
							if (!instruction.func(inputItem, instruction.data)) {
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
							var record = instruction.func(instruction.data, inputIndex);
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

			return acceptingTraces;
		};

		return VM;
	}
);
