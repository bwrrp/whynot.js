/**
 * @module whynot
 */
define(
	[
		'./Trace'
	],
	function(
		Trace
		) {
		'use strict';

		/**
		 * A Thread represents scheduled execution of a specific instruction.
		 *
		 * @class Thread
		 * @constructor
		 *  
		 * @param {Number} pc             Program counter for the scheduled instruction
		 * @param {Thread} [parentThread] The thread that spawned this thread
		 * @param {Number} [badness]      Increasing badness decreases thread priority
		 */
		function Thread(pc, parentThread, badness) {
			this.pc = pc;

			var prefixTrace = parentThread ? parentThread.trace : null;
			this.trace = new Trace(pc, prefixTrace);

			this.badness = badness || 0;
		}

		/**
		 * Another thread joins the current, combine traces and badness.
		 *
		 * @method join
		 * 
		 * @param  {Thread} [otherParentThread] Parent thread of the other thread
		 * @param  {Number} [badness]           Badness of the other thread
		 */
		Thread.prototype.join = function(otherParentThread, badness) {
			this.trace.prefixes.push(otherParentThread.trace);
			this.badness = Math.max(this.badness, badness);
		};

		return Thread;
	}
);
