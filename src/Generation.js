/**
 * @module whynot
 */
define(
	[
		'./Thread'
	],
	function(
		Thread
		) {
		'use strict';

		/**
		 * Represents the threads scheduled to operate on a single input item
		 *
		 * @class Generation
		 * @constructor
		 *
		 * @param {Number}   programLength The length of the program being run
		 * @param {Thread[]} oldThreadList Array used for recycling Thread objects
		 */
		function Generation(programLength, oldThreadList) {
			this._threadList = [];
			this._oldThreads = oldThreadList;

			this._nextThread = 0;

			this._programLength = programLength;
			this._threadsByProgramCounter = new Array(programLength);
		}

		/**
		 * Resets the Generation for reuse.
		 *
		 * @method reset
		 */
		Generation.prototype.reset = function() {
			// Compact and recycle threads
			var i, l;
			for (i = 0, l = this._threadList.length; i < l; ++i) {
				var thread = this._threadList[i];
				thread.compact();
				this._oldThreads.push(thread);
			}
			this._threadList.length = 0;
			// Reset thread counter
			this._nextThread = 0;
			// Reset threads by program counter lookup
			for (i = 0, l = this._programLength; i < l; ++i) {
				this._threadsByProgramCounter[i] = null;
			}
		};

		function createThread(oldThreads, pc, parentThread, badness) {
			if (!oldThreads.length) {
				return new Thread(pc, parentThread, badness);
			}

			// Recycle existing thread
			var thread = oldThreads.pop();
			Thread.call(thread, pc, parentThread, badness);
			return thread;
		}

		function findInsertionIndex(threadList, nextThreadIndex, badness) {
			// Perform a binary search to find the index of the first thread with lower badness
			var low = nextThreadIndex,
				high = threadList.length;
			while (low < high) {
				// Use zero-filling shift as integer division
				var mid = (low + high) >>> 1;
				// Compare to mid point, preferring right in case of equality
				if (badness < threadList[mid].badness) {
					// Thread goes in lower half
					high = mid;
				} else {
					// Thread goes in upper half
					low = mid + 1;
				}
			}

			return low;
		}

		/**
		 * Adds a Thread to the Generation.
		 * Only a single thread can be added for each instruction, subsequent threads are joined
		 * with the previous threads. All traces are preserved, but only a single
		 * thread continues execution. This works, because instructions never depend on a
		 * thread's history.
		 *
		 * @method addThread
		 *
		 * @param {Number} pc             Program counter for the new Thread
		 * @param {Thread} [parentThread] Thread which spawned the new Thread
		 * @param {Number} [badness]      Increasing badness decreases thread priority
		 *
		 * @return {Thread|null} The Thread that was added, or null if no thread was added
		 */
		Generation.prototype.addThread = function(pc, parentThread, badness) {
			// Only add threads for in-program locations
			if (pc >= this._programLength) {
				return null;
			}

			// If a thread for pc already exists in this generation, combine traces and return
			var existingThreadForProgramCounter = this._threadsByProgramCounter[pc];
			if (existingThreadForProgramCounter) {
				// Detect repetition in the same generation, which would cause cyclic traces
				if (!parentThread.trace.contains(pc)) {
					// Non-cyclic trace, join threads
					existingThreadForProgramCounter.join(parentThread, badness);
				}

				return null;
			}

			var thread = createThread(this._oldThreads, pc, parentThread, badness);

			// Schedule thread according to badness
			var index = findInsertionIndex(this._threadList, this._nextThread, badness);
			this._threadList.splice(index, 0, thread);

			this._threadsByProgramCounter[pc] = thread;

			return thread;
		};

		/**
		 * Returns the next Thread to run for this generation.
		 *
		 * @method getNextThread
		 *
		 * @return {Thread|null} The Thread to run, or null if there are no threads left.
		 */
		Generation.prototype.getNextThread = function() {
			if (this._nextThread >= this._threadList.length) {
				return null;
			}
			return this._threadList[this._nextThread++];
		};

		return Generation;
	}
);
