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
		 * @param {Number} generationNumber The index of the current generation
		 */
		function Trace(pc, programLength, precedingTrace, generationNumber) {
			this.head = [pc];
			this.records = [];
			this.prefixes = [];
			this._descendants = [];

			this._programLength = programLength;

			if (precedingTrace) {
				this.prefixes.push(precedingTrace);
				precedingTrace._descendants.push(this);
				this._visitedInstructions = precedingTrace._visitedInstructions.slice(0);
			} else {
				this._visitedInstructions = new Array(programLength);
			}
			this._visitedInstructions[pc] = generationNumber;
		}

		function mergeVisitedInstructions(targetVisitedInstructions, otherVisitedInstructions, programLength) {
			for (var i = 0; i < programLength; ++i) {
				var ourGeneration = targetVisitedInstructions[i],
					otherGeneration = otherVisitedInstructions[i];

				if (ourGeneration === undefined) {
					targetVisitedInstructions[i] = otherGeneration;
				} else if (otherGeneration !== undefined) {
					targetVisitedInstructions[i] = Math.max(
						ourGeneration, otherGeneration);
				}
			}
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

			(function mergeVisitedInstructionsIntoTrace(trace) {
				// Merge prefixTrace's set of visited instructions into our own
				mergeVisitedInstructions(
					trace._visitedInstructions,
					prefixTrace._visitedInstructions,
					trace._programLength);
				// Do the same for the descendants
				for (var i = 0, l = trace._descendants.length; i < l; ++i) {
					mergeVisitedInstructionsIntoTrace(trace._descendants[i]);
				}
			})(this);
		};

		/**
		 * Returns whether the Trace has visited the specified instruction, in the given generation.
		 * If no generation is given, it is tested if the trace has passed the instruction at all.
		 *
		 * @method contains
		 *
		 * @param {Number} pc           Program counter for the instruction to test
		 * @param {Number} [generation] The index of the generation to test for
		 *
		 * @return {Boolean} Whether the trace has visited the instruction
		 */
		Trace.prototype.contains = function(pc, generation) {
			if (generation === undefined) {
				return this._visitedInstructions[pc] !== undefined;
			}
			return this._visitedInstructions[pc] === generation;
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
