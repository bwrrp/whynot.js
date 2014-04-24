define(
	[
		'whynot/Assembler'
	],
	function(
		Assembler
		) {
		'use strict';

		describe('Assembler', function() {
			var assembler;
			beforeEach(function() {
				assembler = new Assembler();
			});

			function truth() {
				return true;
			}

			describe('.test()', function() {
				it('generates a test instruction', function() {
					var instruction = assembler.test(truth);
					chai.expect(instruction.op).to.equal('test');
					chai.expect(instruction.func).to.equal(truth);
				});

				it('generates a test instruction with data', function() {
					var instruction = assembler.test(truth, 'meep');
					chai.expect(instruction.op).to.equal('test');
					chai.expect(instruction.func).to.equal(truth);
					chai.expect(instruction.data).to.equal('meep');
				});

				it('appends the instruction to the program', function() {
					var instruction = assembler.test(truth);
					chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
				});
			});

			describe('.jump()', function() {
				it('generates a jump instruction', function() {
					var instruction = assembler.jump([1, 2, 3]);
					chai.expect(instruction.op).to.equal('jump');
					chai.expect(instruction.data).to.deep.equal([1, 2, 3]);
				});

				it('appends the instruction to the program', function() {
					var instruction = assembler.jump([]);
					chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
				});
			});

			describe('.record()', function() {
				var data = {};

				describe('without recorder', function() {
					it('generates a record instruction', function() {
						var instruction = assembler.record(data);
						chai.expect(instruction.op).to.equal('record');
						chai.expect(instruction.func(instruction.data, 0)).to.equal(data);
					});

					it('appends the instruction to the program', function() {
						var instruction = assembler.record(data);
						chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
					});
				});
				describe('with recorder', function() {
					function recorder(data, index) {
						return 'meep';
					}

					it('generates a record instruction', function() {
						var instruction = assembler.record(data, recorder);
						chai.expect(instruction.op).to.equal('record');
						chai.expect(instruction.func(instruction.data, 0)).to.equal('meep');
					});

					it('appends the instruction to the program', function() {
						var instruction = assembler.record(data, recorder);
						chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
					});
				});
			});

			describe('.bad()', function() {
				it('generates a bad instruction', function() {
					var instruction = assembler.bad();
					chai.expect(instruction.op).to.equal('bad');
				});

				it('appends the instruction to the program', function() {
					var instruction = assembler.bad();
					chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
				});
			});

			describe('.accept()', function() {
				it('generates an accept instruction', function() {
					var instruction = assembler.accept();
					chai.expect(instruction.op).to.equal('accept');
				});

				it('appends the instruction to the program', function() {
					var instruction = assembler.accept();
					chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
				});
			});

			describe('.fail()', function() {
				describe('unconditional', function() {
					it('generates a fail instruction', function() {
						var instruction = assembler.fail();
						chai.expect(instruction.op).to.equal('fail');
						chai.expect(instruction.func).to.equal(null);
					});

					it('appends the instruction to the program', function() {
						var instruction = assembler.fail();
						chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
					});
				});
				describe('conditional', function() {
					function conditional() {
						return false;
					}

					it('generates a fail instruction', function() {
						var instruction = assembler.fail(conditional);
						chai.expect(instruction.op).to.equal('fail');
						chai.expect(instruction.func).to.equal(conditional);
					});

					it('appends the instruction to the program', function() {
						var instruction = assembler.fail(conditional);
						chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
					});
				});
			});
		});
	}
);
