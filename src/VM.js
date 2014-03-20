define(
	[
		'./scheduler'
	],
	function(Scheduler) {
		'use strict';

		function VM(program) {
			this.program = program;
			this.scheduler = new Scheduler(2, program.length);
		}

		VM.prototype.reset = function() {
			this.scheduler.reset();

			// Initialize initial thread
			this.scheduler.addThread(0, [], 0, 0);
		};

		VM.prototype.execute = function(input) {
			this.reset();

			var scheduler = this.scheduler,
				inputItem;
			do {
				// Get next thread to execute
				var thread = scheduler.getNextThread();
				if (!thread)
					break;

				// Read next input item
				inputItem = input.next();

				while (thread) {
					var instruction = this.program[thread.pc];

					switch (instruction.op) {
						case 'accept':
							// Only accept if empty
							if (!inputItem)
								return thread.record || true;
							break;

						case 'fail':
							// Branch is forbidden, end the thread
							break;

						case 'bad':
							scheduler.addThread(
								thread.pc + 1,
								thread.record,
								thread.badness + instruction.data,
								0);
							break;

						case 'test':
							if (!inputItem || !instruction.func(inputItem, instruction.data))
								break;
							scheduler.addThread(
								thread.pc + 1,
								thread.record,
								thread.badness,
								1);
							break;

						case 'jump':
							for (var iTarget = 0, nTargets = instruction.data.length; iTarget < nTargets; ++iTarget) {
								scheduler.addThread(
									instruction.data[iTarget],
									iTarget === 0 ? thread.record : thread.record.concat(),
									thread.badness,
									0);
							}
							break;

						case 'record':
							instruction.func(thread.record, instruction.data, input.pos);
							scheduler.addThread(
								thread.pc + 1,
								thread.record,
								thread.badness,
								0);
							break;
					}

					// Next thread
					thread = scheduler.getNextThread();
				}

				scheduler.nextGeneration();
			} while (inputItem);

			return false;
		};

		return VM;
	}
);
