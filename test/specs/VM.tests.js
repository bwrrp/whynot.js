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
					var traces = vm.execute(createInput([]));
					chai.expect(traces.length).to.equal(1);
				});

				it('fails when invoked with current input', function() {
					var traces = vm.execute(createInput([1]));
					chai.expect(traces.length).to.equal(0);
				});
			});

			describe('fail', function() {
				var vm;
				beforeEach(function() {
					vm = whynot.compileVM(function(assembler) {
						assembler.fail();
					});
				});

				it('ends the thread', function() {
					chai.expect(vm.execute(createInput([])).length).to.equal(0);
					chai.expect(vm.execute(createInput([1])).length).to.equal(0);
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
					var leftTraces = vmLeftBad.execute(createInput([])),
						rightTraces = vmRightBad.execute(createInput([]));
					chai.expect(flattenTrace(leftTraces[0])).to.deep.equal([[0, 3, 4, 5], [0, 1, 2, 5]]);
					chai.expect(flattenTrace(rightTraces[0])).to.deep.equal([[0, 1, 2, 5], [0, 3, 4, 5]]);
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
					var traces = vm.execute(createInput(['meep']));
					chai.expect(traces.length).to.equal(1);
				});

				it('ends the thread when the test fails', function() {
					var traces = vm.execute(createInput(['bla']));
					chai.expect(traces.length).to.equal(0);
				});
			});

			describe('jump', function() {
				it('can create a single new thread', function() {
					var vm = whynot.compileVM(function(assembler) {
						assembler.jump([1]);
						assembler.accept();
					});
					chai.expect(vm.execute(createInput([])).map(flattenTrace)).to.deep.equal([[[0, 1]]]);
				});

				it('can create multiple new threads', function() {
					var vm = whynot.compileVM(function(assembler) {
						assembler.jump([1, 2]);
						assembler.accept();
						assembler.accept();
					});
					chai.expect(vm.execute(createInput([])).map(flattenTrace)).to.deep.equal([[[0, 1]],[[0, 2]]]);
				});
			});

			describe('record', function() {
				it('can record static data', function() {
					var vm = whynot.compileVM(function(assembler) {
						assembler.record('meep');
						assembler.accept();
					});

					var trace = vm.execute(createInput([]))[0];

					chai.expect(trace.records).to.deep.equal(['meep']);
				});

				it('can use a recorder callback', function() {
					var vm = whynot.compileVM(function(assembler) {
						assembler.record('meep', function(data, index) {
							return index + '-' + data.toUpperCase();
						});
						assembler.accept();
					});

					var trace = vm.execute(createInput([]))[0];

					chai.expect(trace.records).to.deep.equal(['0-MEEP']);
				});
			});
		});
	}
);
