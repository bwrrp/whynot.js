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
		function Trace(pc, programLength, precedingTrace) {
			this.head = [pc];
			this.records = [];
			this.prefixes = [];

			this._programLength = programLength;

			if (precedingTrace) {
				this.prefixes.push(precedingTrace);
				this._visitedInstructions = precedingTrace._visitedInstructions.slice(0);
			} else {
				this._visitedInstructions = new Array(programLength);
			}
			this._visitedInstructions[pc] = true;
		}

		/**
		 * Combines the Trace with the given prefix, thereby recording multiple ways to get
		 * to the current trace's head. Assumes the Trace has not yet been compacted.
		 *
		 * @method join
		 *
		 * @param {Trace} prefixTrace The Trace to add as a prefix of the current
		 */
		Trace.prototype.join = function(prefixTrace) {
			this.prefixes.push(prefixTrace);

			// Merge prefixTrace's set of visited instructions into our own
			for (var i = 0, l = this._programLength; i < l; ++i) {
				if (prefixTrace._visitedInstructions[i]) {
					this._visitedInstructions[i] = true;
				}
			}
		};

		/**
		 * Returns whether the Trace has visited the specified instruction.
		 *
		 * @method contains
		 *
		 * @param {Number} pc Program counter for the instruction to test
		 *
		 * @return {Boolean} Whether the trace has visited the instruction
		 */
		Trace.prototype.contains = function(pc) {
			return !!this._visitedInstructions[pc];
		};

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
			// Recurse
			for (var i = 0, l = trace.prefixes.length; i < l; ++i) {
				trace.prefixes[i].compact();
			}
		};

		return Trace;
	}
);
