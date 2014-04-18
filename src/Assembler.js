/**
 * @module whynot
 */
define(
	function() {
		'use strict';

		/**
		 * The Assembler is used to generate a whynot program by appending instructions.
		 *
		 * @class Assembler
		 * @constructor
		 */
		function Assembler() {
			this.program = [];
		}

		function addInstruction(program, op, func, data) {
			var instruction = {
				op: op,
				func: func,
				data: data
			};
			program.push(instruction);
			return instruction;
		}

		/**
		 * The 'test' instruction validates and consumes an input item.
		 * If the matcher returns true, execution continues in the next Generation, otherwise
		 * execution of the current Thread ends.
		 *
		 * @method test
		 * 
		 * @param {Function} matcher Callback to invoke for the input,
		 *                             should return true to accept, false to reject.
		 *
		 * @return {Object} The new instruction
		 */
		Assembler.prototype.test = function(matcher) {
			return addInstruction(
				this.program,
				'test',
				matcher,
				null
			);
		};

		/**
		 * The 'jump' instruction continues execution in the current Generation at any number
		 * of other locations. A new Thread will be spawned for each target.
		 *
		 * @method jump
		 * 
		 * @param {Number[]} targets Program counters at which to continue execution
		 * 
		 * @return {Object} The new instruction
		 */
		Assembler.prototype.jump = function(targets) {
			return addInstruction(
				this.program,
				'jump',
				null,
				targets
			);
		};

		function defaultRecorder(data, inputIndex) {
			return data;
		}

		/**
		 * The 'record' instruction adds a custom record to the current Thread's trace and
		 * resumes execution at the next instruction in the same Generation.
		 *
		 * @method record
		 * 
		 * @param {Any}      data       Data to record
		 * @param {Function} [recorder] Callback to generate the record based on data and the 
		 *                                current input position. Defaults to recording data.
		 *
		 * @return {Object} The new instruction
		 */
		Assembler.prototype.record = function(data, recorder) {
			return addInstruction(
				this.program,
				'record',
				recorder || defaultRecorder,
				data
			);
		};

		/**
		 * The 'bad' instruction permanently lowers the priority of all threads originating in
		 * the current one.
		 *
		 * @method bad
		 * 
		 * @param {Number} cost Amount to increase badness with. Defaults to 1.
		 * 
		 * @return {Object} The new instruction
		 */
		Assembler.prototype.bad = function(cost) {
			return addInstruction(
				this.program,
				'bad',
				null,
				cost || 1
			);
		};

		/**
		 * The 'accept' instruction causes the VM to yield the current Thread's Trace upon
		 * completion, provided all input has been consumed. Otherwise, the Thread ends.
		 *
		 * @method accept
		 * 
		 * @return {Object} The new instruction
		 */
		Assembler.prototype.accept = function() {
			return addInstruction(
				this.program,
				'accept',
				null,
				null
			);
		};

		/**
		 * The 'fail' instruction ends the current Thread.
		 *
		 * @method fail
		 *
		 * @param {Function} [predicate] Optional callback to make the fail conditional, if this
		 *                                 returns true the thread will end, otherwise it will
		 *                                 continue.
		 * 
		 * @return {Object} The new instruction
		 */
		Assembler.prototype.fail = function(predicate) {
			return addInstruction(
				this.program,
				'fail',
				predicate || null,
				null
			);
		};

		return Assembler;
	}
);
