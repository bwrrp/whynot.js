define(
	function() {
		'use strict';

		function Assembler() {
			this.program = [];
		}

		function defaultMatcher(value, expected) {
			return value === expected;
		}

		Assembler.prototype.addInstruction = function(op, func, data) {
			var instruction = {
				op: op,
				func: func,
				data: data
			};
			this.program.push(instruction);
			return instruction;
		};

		Assembler.prototype.test = function(expected, matcher) {
			return this.addInstruction(
				'test',
				matcher || defaultMatcher,
				expected
			);
		};

		Assembler.prototype.jump = function(targets) {
			return this.addInstruction(
				'jump',
				null,
				targets
			);
		};

		function defaultRecorder(record, data, nextInput) {
			record.push(data);
		}

		Assembler.prototype.record = function(data, recorder) {
			return this.addInstruction(
				'record',
				recorder || defaultRecorder,
				data
			);
		};

		Assembler.prototype.bad = function(cost) {
			return this.addInstruction(
				'bad',
				null,
				cost || 1
			);
		};

		Assembler.prototype.accept = function() {
			return this.addInstruction(
				'accept',
				null,
				null
			);
		};

		Assembler.prototype.fail = function() {
			return this.addInstruction(
				'fail',
				null,
				null
			);
		};

		return Assembler;
	}
);
