/**
 * @module whynot
 */
define(
	[
		'./Generation'
	],
	function(
		Generation
		) {
		'use strict';

		var REPEAT_BADNESS = 1.0;

		/**
		 * Schedules Threads to run in the current or a future Generation.
		 *
		 * @class Scheduler
		 * @constructor
		 *
		 * @param {Number}   numGenerations Number of Generations to plan ahead
		 * @param {Number}   programLength  Length of the program being run
		 * @param {Thread[]} oldThreadList  Array used for recycling Thread objects
		 */
		function Scheduler(numGenerations, programLength, oldThreadList) {
			// The active and scheduled generations
			this._generations = [];
			for (var i = 0; i < numGenerations; ++i) {
				this._generations.push(new Generation(programLength, oldThreadList, i));
			}
			// The number of generations executed so far
			this._generationsCompleted = 0;
		}

		/**
		 * Resets the Scheduler for reuse.
		 *
		 * @method reset
		 */
		Scheduler.prototype.reset = function() {
			// Reset each generation
			for (var i = 0, l = this._generations.length; i < l; ++i) {
				this._generations[i].reset(i);
			}
			this._generationsCompleted = 0;
		};

		function getRelativeGeneration(scheduler, generationOffset) {
			// Determine generation to insert the new thread for
			var numGenerations = scheduler._generations.length;
			if (generationOffset >= numGenerations) {
				throw new Error('Not enough active generations to schedule that far ahead');
			}
			var generationNumber = scheduler._generationsCompleted + generationOffset;
			return scheduler._generations[generationNumber % numGenerations];
		}

		/**
		 * Adds a Thread to the Generation at the given offset relative to the current one.
		 *
		 * @method addThread
		 *
		 * @param {Number} generationOffset Offset of the target generation, relative to the current
		 * @param {Number} pc               Program counter for the new Thread
		 * @param {Thread} [parentThread]   Thread which spawned the new Thread
		 * @param {Number} [badness]        Increasing badness decreases thread priority
		 *
		 * @return {Thread|null} The Thread that was added, or null if no thread was added
		 */
		Scheduler.prototype.addThread = function(generationOffset, pc, parentThread, badness) {
			// Prefer non-repeating threads over repeating ones
			if (parentThread && parentThread.trace.contains(pc)) {
				badness += REPEAT_BADNESS;
			}

			var generationForThread = getRelativeGeneration(this, generationOffset);

			// Add thread to the generation
			return generationForThread.addThread(pc, parentThread, badness);
		};

		/**
		 * Returns the next thread to run in the current Generation.
		 *
		 * @method getNextThread
		 *
		 * @return {Thread|null} The next Thread to run, or null if there are none left
		 */
		Scheduler.prototype.getNextThread = function() {
			var currentGeneration = getRelativeGeneration(this, 0);
			return currentGeneration.getNextThread();
		};

		/**
		 * Switches to the next Generation.
		 *
		 * @method nextGeneration
		 */
		Scheduler.prototype.nextGeneration = function() {
			// Recycle current generation and move to next
			var currentGeneration = getRelativeGeneration(this, 0);
			currentGeneration.reset(this._generationsCompleted + this._generations.length);
			++this._generationsCompleted;
		};

		return Scheduler;
	}
);
