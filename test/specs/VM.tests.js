define(
	[
		'whynot'
	],
	function(
		whynot
		) {
		'use strict';

		describe('VM', function() {
			function createInput(array) {
				var i = 0;
				return function() {
					return array[i++] || null;
				};
			}

			function flattenTrace(trace, head, flatTraces) {
				if (!Array.isArray(head)) {
					head = [];
					flatTraces = [];
				}
				var combinedHead = trace.head.concat(head);
				if (!trace.prefixes.length) {
					flatTraces.push(combinedHead);
				} else {
					for (var i = 0, l = trace.prefixes.length; i < l; ++i) {
						flattenTrace(trace.prefixes[i], combinedHead, flatTraces);
					}
				}
				return flatTraces;
			}

			describe('accept', function() {
				var vm;
				beforeEach(function() {
					vm = whynot.compileVM(function(assembler) {
						assembler.accept();
					});
				});

				it('generates an accepting trace at the end of input', function() {
					var result = vm.execute(createInput([]));
					chai.expect(result.success).to.equal(true);
					chai.expect(result.acceptingTraces.length).to.equal(1);
				});

				it('fails when invoked with current input', function() {
					var result = vm.execute(createInput([1]));
					chai.expect(result.success).to.equal(false);
					chai.expect(result.acceptingTraces.length).to.equal(0);
					chai.expect(result.failingTraces.length).to.be.above(0);
				});
			});

			describe('fail', function() {
				describe('unconditional', function() {
					var vm;
					beforeEach(function() {
						vm = whynot.compileVM(function(assembler) {
							assembler.fail();
						});
					});

					it('ends the thread', function() {
						chai.expect(vm.execute(createInput([])).success).to.equal(false);
						chai.expect(vm.execute(createInput([1])).success).to.equal(false);
					});
				});
				
				describe('conditional', function() {
					var vm,
						condition = false;
					beforeEach(function() {
						vm = whynot.compileVM(function(assembler) {
							assembler.fail(function() {
								return condition;
							});
							assembler.accept();
						});
					});

					it('ends the thread if the condition predicate returns true', function() {
						condition = true;
						var resultWithoutInput = vm.execute(createInput([]));
						chai.expect(resultWithoutInput.success).to.equal(false);
						chai.expect(resultWithoutInput.failingTraces[0].head).to.deep.equal([0]);
						var resultWithInput = vm.execute(createInput([1]));
						chai.expect(resultWithInput.success).to.equal(false);
						chai.expect(resultWithInput.failingTraces[0].head).to.deep.equal([0]);
					});

					it('continues the thread if the condition predicate returns false', function() {
						condition = false;
						var resultWithoutInput = vm.execute(createInput([]));
						chai.expect(resultWithoutInput.success).to.equal(true);
						chai.expect(resultWithoutInput.acceptingTraces[0].head).to.deep.equal([0, 1]);
						var resultWithInput = vm.execute(createInput([1]));
						chai.expect(resultWithInput.success).to.equal(false);
						chai.expect(resultWithInput.failingTraces[0].head).to.deep.equal([0, 1]);
					});
				});
			});

			describe('bad', function() {
				var vmLeftBad,
					vmRightBad;
				beforeEach(function() {
					// Create two branches of equal length, one badness 1, the other 0
					vmLeftBad = whynot.compileVM(function(assembler) {
						assembler.jump([1, 3]); // 0
						assembler.bad(100);     // 1
						assembler.jump([5]);    // 2
						assembler.bad(1);       // 3
						assembler.jump([5]);    // 4
						assembler.accept();     // 5
					});
					vmRightBad = whynot.compileVM(function(assembler) {
						assembler.jump([1, 3]); // 0
						assembler.bad(1);       // 1
						assembler.jump([5]);    // 2
						assembler.bad(100);     // 3
						assembler.jump([5]);    // 4
						assembler.accept();     // 5
					});
				});

				it('lowers thread priority by its cost', function() {
					var leftResult = vmLeftBad.execute(createInput([])),
						rightResult = vmRightBad.execute(createInput([]));
					chai.expect(flattenTrace(leftResult.acceptingTraces[0])).to.deep.equal([[0, 3, 4, 5], [0, 1, 2, 5]]);
					chai.expect(flattenTrace(rightResult.acceptingTraces[0])).to.deep.equal([[0, 1, 2, 5], [0, 3, 4, 5]]);
				});
			});

			describe('test', function() {
				function isMeep(item) {
					return item === 'meep';
				}

				var vm;
				beforeEach(function() {
					vm = whynot.compileVM(function(assembler) {
						assembler.test(isMeep);
						assembler.accept();
					});
				});

				it('moves a thread to the next generation when the test succeeds', function() {
					var result = vm.execute(createInput(['meep']));
					chai.expect(result.success).to.equal(true);
					chai.expect(result.acceptingTraces.length).to.equal(1);
					chai.expect(result.acceptingTraces[0].head).to.deep.equal([0, 1]);
				});

				it('ends the thread when the test fails', function() {
					var result = vm.execute(createInput(['bla']));
					chai.expect(result.success).to.equal(false);
					chai.expect(result.acceptingTraces.length).to.equal(0);
					chai.expect(result.failingTraces.length).to.equal(1);
					chai.expect(result.failingTraces[0].head).to.deep.equal([0]);
				});
			});

			describe('jump', function() {
				it('can create a single new thread', function() {
					var vm = whynot.compileVM(function(assembler) {
						assembler.jump([1]);
						assembler.accept();
					});
					var result = vm.execute(createInput([]));
					chai.expect(result.success).to.equal(true);
					chai.expect(result.acceptingTraces.map(flattenTrace)).to.deep.equal([[[0, 1]]]);
				});

				it('can create multiple new threads', function() {
					var vm = whynot.compileVM(function(assembler) {
						assembler.jump([1, 2]);
						assembler.accept();
						assembler.accept();
					});
					var result = vm.execute(createInput([]));
					chai.expect(result.success).to.equal(true);
					chai.expect(result.acceptingTraces.map(flattenTrace)).to.deep.equal([[[0, 1]],[[0, 2]]]);
				});
			});

			describe('record', function() {
				it('can record static data', function() {
					var vm = whynot.compileVM(function(assembler) {
						assembler.record('meep');
						assembler.accept();
					});

					var result = vm.execute(createInput([]));
					chai.expect(result.success).to.equal(true);
					chai.expect(result.acceptingTraces[0].records).to.deep.equal(['meep']);
				});

				it('can use a recorder callback', function() {
					var vm = whynot.compileVM(function(assembler) {
						assembler.record('meep', function(data, index) {
							return index + '-' + data.toUpperCase();
						});
						assembler.accept();
					});

					var result = vm.execute(createInput([]));
					chai.expect(result.success).to.equal(true);
					chai.expect(result.acceptingTraces[0].records).to.deep.equal(['0-MEEP']);
				});
			});
		});
	}
);
