define(
	function() {
		'use strict';

		function Scheduler(numLists, programLength) {
			this.threadGeneration = 0;
			this.instructionGenerations = [];

			this.threadLists = [];
			this.currentList = 0;
			this.nextThread = 0;
			this.oldThreads = [];

			var list;
			for (list = 0; list < numLists; ++list) {
				this.threadLists.push([]);
			}

			for (var i = 0; i < programLength; ++i) {
				var generations = [];
				for (list = 0; list < numLists; ++list) {
					generations.push([]);
				}
				this.instructionGenerations.push(generations);
			}
		}

		Scheduler.prototype.clearThreadList = function(list) {
			this.oldThreads.push.apply(this.oldThreads, this.threadLists[list]);
			this.threadLists[list].length = 0;
		};

		Scheduler.prototype.reset = function() {
			// Reset thread generation and pointers
			this.threadGeneration = 0;
			this.currentList = 0;
			this.nextThread = 0;

			for (var list = 0, numLists = this.threadLists.length; list < numLists; ++list) {
				// Recycle threads
				this.clearThreadList(list);

				// Reset instruction generations
				for (var i = 0, l = this.instructionGenerations.length; i < l; ++i) {
					this.instructionGenerations[i][list] = -1;
				}
			}
		};

		Scheduler.prototype.getNewThread = function(pc, record, badness) {
			var thread = this.oldThreads.pop() || {
				pc: pc,
				record: record,
				badness: badness
			};
			thread.pc = pc;
			thread.record = record;
			thread.badness = badness;

			return thread;
		};

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

		Scheduler.prototype.addThread = function(pc, record, badness, generationOffset) {
			// Only add threads for in-program locations
			if (pc >= this.instructionGenerations.length)
				return;

			// Determine list and generation for the new thread
			var numLists = this.threadLists.length,
				list = (this.currentList + generationOffset) % numLists,
				instructionGeneration = this.instructionGenerations[pc][list],
				threadGeneration = this.threadGeneration + generationOffset;

			// Is a thread for this instruction already present in the list? 
			if (instructionGeneration === threadGeneration)
				return;

			var thread = this.getNewThread(pc, record, badness);

			this.instructionGenerations[pc][list] = threadGeneration;

			// Schedule thread according to badness
			var threadList = this.threadLists[list],
				index = findInsertionIndex(threadList, generationOffset ? 0 : this.nextThread, badness);
			threadList.splice(index, 0, thread);
		};

		Scheduler.prototype.getNextThread = function() {
			var currentThreadList = this.threadLists[this.currentList];
			return currentThreadList[this.nextThread++];
		};

		Scheduler.prototype.nextGeneration = function() {
			// Recycle current thread list and move to next
			this.clearThreadList(this.currentList);
			this.currentList = (this.currentList + 1) % this.threadLists.length;
			this.nextThread = 0;

			// Increment thread generation
			++this.threadGeneration;
		};

		return Scheduler;
	}
);
