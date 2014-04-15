/**
 * @module whynot
 */
define(
	function() {
		'use strict';

		/**
		 * A Trace represents the execution history of a Thread
		 *
		 * @class Trace
		 * @constructor
		 * 
		 * @param {Number} pc               Program counter for the most recent instruction
		 * @param {Trace}  [precedingTrace] Trace that preceded the current one
		 */
		function Trace(pc, precedingTrace) {
			this.head = [pc];
			this.records = [];
			this.prefixes = [];
			if (precedingTrace) {
				this.prefixes.push(precedingTrace);
			}
		}

		/**
		 * Compacts the trace, concatenating all non-branching prefixes.
		 *
		 * @method compact
		 */
		Trace.prototype.compact = function() {
			var trace = this;
			while (trace.prefixes.length === 1) {
				// Trace has a single prefix, combine traces
				var prefix = trace.prefixes[0];
				// Combine heads
				this.head.unshift.apply(this.head, prefix.head);
				// Combine records
				this.records.unshift.apply(this.records, prefix.records);
				// Adopt prefixes
				this.prefixes = prefix.prefixes;
				// Continue
				trace = prefix;
			}
		};

		return Trace;
	}
);
