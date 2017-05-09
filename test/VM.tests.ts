import Result from '../src/Result';
import Trace from '../src/Trace';
import { Assembler, VM, default as whynot } from '../src/index';

import * as chai from 'chai';

describe('VM', () => {
	function createInput (array: any[]): () => any | null {
		let i = 0;
		return () => {
			return array[i++] || null;
		};
	}

	function flattenTrace (trace: Trace, head: number[] = [], flatTraces: number[][] = []) {
		var combinedHead = trace.head.concat(head);
		if (!trace.prefixes.length) {
			flatTraces.push(combinedHead);
		} 
		else {
			for (var i = 0, l = trace.prefixes.length; i < l; ++i) {
				flattenTrace(trace.prefixes[i], combinedHead, flatTraces);
			}
		}
		return flatTraces;
	}

	describe('accept', () => {
		let vm: VM;
		beforeEach(() => {
			vm = whynot.compileVM(function (assembler: Assembler) {
				assembler.accept();
			});
		});

		it('generates an accepting trace at the end of input', () => {
			const result = vm.execute(createInput([]));
			chai.expect(result.success).to.equal(true);
			chai.expect(result.acceptingTraces.length).to.equal(1);
		});

		it('fails when invoked with current input', () => {
			const result = vm.execute(createInput([1]));
			chai.expect(result.success).to.equal(false);
			chai.expect(result.acceptingTraces.length).to.equal(0);
			chai.expect(result.failingTraces.length).to.be.above(0);
		});
	});

	describe('fail', () => {
		describe('unconditional', () => {
			let vm: VM;
			beforeEach(() => {
				vm = whynot.compileVM(function (assembler: Assembler) {
					assembler.fail();
				});
			});

			it('ends the thread', () => {
				chai.expect(vm.execute(createInput([])).success).to.equal(false);
				chai.expect(vm.execute(createInput([1])).success).to.equal(false);
			});
		});
		
		describe('conditional', () => {
			let vm: VM;
			let condition: boolean;
			beforeEach(() => {
				vm = whynot.compileVM(function (assembler: Assembler) {
					assembler.fail(() => {
						return condition;
					});
					assembler.accept();
				});
				condition = false;
			});

			it('ends the thread if the condition predicate returns true', () => {
				condition = true;
				const resultWithoutInput = vm.execute(createInput([]));
				chai.expect(resultWithoutInput.success).to.equal(false);
				chai.expect(resultWithoutInput.failingTraces[0].head).to.deep.equal([0]);
				const resultWithInput = vm.execute(createInput([1]));
				chai.expect(resultWithInput.success).to.equal(false);
				chai.expect(resultWithInput.failingTraces[0].head).to.deep.equal([0]);
			});

			it('continues the thread if the condition predicate returns false', () => {
				condition = false;
				const resultWithoutInput = vm.execute(createInput([]));
				chai.expect(resultWithoutInput.success).to.equal(true);
				chai.expect(resultWithoutInput.acceptingTraces[0].head).to.deep.equal([0, 1]);
				const resultWithInput = vm.execute(createInput([1]));
				chai.expect(resultWithInput.success).to.equal(false);
				chai.expect(resultWithInput.failingTraces[0].head).to.deep.equal([0, 1]);
			});
		});

		describe('conditional with options', () => {
			let vm: VM;
			beforeEach(() => {
				vm = whynot.compileVM(function (assembler: Assembler) {
					assembler.fail(function (options: any) {
						return options.shouldFail;
					});
					assembler.accept();
				});
			});

			it('ends the thread if the condition predicate returns true', () => {
				const resultWithoutInput = vm.execute(createInput([]), {shouldFail: true});
				chai.expect(resultWithoutInput.success).to.equal(false);
				chai.expect(resultWithoutInput.failingTraces[0].head).to.deep.equal([0]);
				const resultWithInput = vm.execute(createInput([1]), {shouldFail: true});
				chai.expect(resultWithInput.success).to.equal(false);
				chai.expect(resultWithInput.failingTraces[0].head).to.deep.equal([0]);
			});

			it('continues the thread if the condition predicate returns false', () => {
				const resultWithoutInput = vm.execute(createInput([]), {shouldFail: false});
				chai.expect(resultWithoutInput.success).to.equal(true);
				chai.expect(resultWithoutInput.acceptingTraces[0].head).to.deep.equal([0, 1]);
				const resultWithInput = vm.execute(createInput([1]), {shouldFail: false});
				chai.expect(resultWithInput.success).to.equal(false);
				chai.expect(resultWithInput.failingTraces[0].head).to.deep.equal([0, 1]);
			});
		});
	});

	describe('bad', () => {
		let vmLeftBad: VM;
		let vmRightBad: VM;
		beforeEach(() => {
			// Create two branches of equal length, one badness 1, the other 0
			vmLeftBad = whynot.compileVM(function (assembler: Assembler) {
				assembler.jump([1, 3]); // 0
				assembler.bad(100);     // 1
				assembler.jump([5]);    // 2
				assembler.bad(1);       // 3
				assembler.jump([5]);    // 4
				assembler.accept();     // 5
			});
			vmRightBad = whynot.compileVM(function (assembler: Assembler) {
				assembler.jump([1, 3]); // 0
				assembler.bad(1);       // 1
				assembler.jump([5]);    // 2
				assembler.bad(100);     // 3
				assembler.jump([5]);    // 4
				assembler.accept();     // 5
			});
		});

		it('lowers thread priority by its cost', () => {
			const leftResult = vmLeftBad.execute(createInput([]));
			const rightResult = vmRightBad.execute(createInput([]));
			chai.expect(flattenTrace(leftResult.acceptingTraces[0])).to.deep.equal([[0, 3, 4, 5], [0, 1, 2, 5]]);
			chai.expect(flattenTrace(rightResult.acceptingTraces[0])).to.deep.equal([[0, 1, 2, 5], [0, 3, 4, 5]]);
		});
	});

	describe('test', () => {
		function isMeep (item: string) {
			return item === 'meep';
		}

		let vm: VM;
		beforeEach(() => {
			vm = whynot.compileVM(function (assembler: Assembler) {
				assembler.test(isMeep);
				assembler.accept();
			});
		});

		it('moves a thread to the next generation when the test succeeds', () => {
			const result = vm.execute(createInput(['meep']));
			chai.expect(result.success).to.equal(true);
			chai.expect(result.acceptingTraces.length).to.equal(1);
			chai.expect(result.acceptingTraces[0].head).to.deep.equal([0, 1]);
		});

		it('ends the thread when the test fails', () => {
			const result = vm.execute(createInput(['bla']));
			chai.expect(result.success).to.equal(false);
			chai.expect(result.acceptingTraces.length).to.equal(0);
			chai.expect(result.failingTraces.length).to.equal(1);
			chai.expect(result.failingTraces[0].head).to.deep.equal([0]);
		});

		describe('with options', () => {
			beforeEach(() => {
				vm = whynot.compileVM(function (assembler: Assembler) {
					assembler.test(function (_item: string, _data: any, options: any) {
						return options.shouldAccept;
					});
					assembler.accept();
				});
			});

			it('moves a thread to the next generation when the test succeeds', () => {
				const result = vm.execute(createInput(['meep']), {shouldAccept: true});
				chai.expect(result.success).to.equal(true);
				chai.expect(result.acceptingTraces.length).to.equal(1);
				chai.expect(result.acceptingTraces[0].head).to.deep.equal([0, 1]);
			});

			it('ends the thread when the test fails', () => {
				const result = vm.execute(createInput(['meep']), {shouldAccept: false});
				chai.expect(result.success).to.equal(false);
				chai.expect(result.acceptingTraces.length).to.equal(0);
				chai.expect(result.failingTraces.length).to.equal(1);
				chai.expect(result.failingTraces[0].head).to.deep.equal([0]);
			});
		});
	});

	describe('jump', () => {
		it('can create a single new thread', () => {
			const vm = whynot.compileVM(function (assembler: Assembler) {
				assembler.jump([1]);
				assembler.accept();
			});
			const result = vm.execute(createInput([]));
			chai.expect(result.success).to.equal(true);
			chai.expect(result.acceptingTraces.map(trace => flattenTrace(trace))).to.deep.equal([[[0, 1]]]);
		});

		it('can create multiple new threads', () => {
			const vm = whynot.compileVM(function (assembler: Assembler) {
				assembler.jump([1, 2]);
				assembler.accept();
				assembler.accept();
			});
			const result = vm.execute(createInput([]));
			chai.expect(result.success).to.equal(true);
			chai.expect(result.acceptingTraces.map(trace => flattenTrace(trace))).to.deep.equal([[[0, 1]],[[0, 2]]]);
		});
	});

	describe('record', () => {
		it('can record static data', () => {
			const vm = whynot.compileVM(function (assembler: Assembler) {
				assembler.record('meep');
				assembler.accept();
			});
			const result = vm.execute(createInput([]));
			chai.expect(result.success).to.equal(true);
			chai.expect(result.acceptingTraces[0].records).to.deep.equal(['meep']);
		});

		it('can use a recorder callback', () => {
			const vm = whynot.compileVM(function (assembler: Assembler) {
				assembler.record('meep', function (data: string, index: number) {
					return index + '-' + data.toUpperCase();
				});
				assembler.accept();
			});
			const result = vm.execute(createInput([]));
			chai.expect(result.success).to.equal(true);
			chai.expect(result.acceptingTraces[0].records).to.deep.equal(['0-MEEP']);
		});

		it('can use options in the recorder callback', () => {
			const vm = whynot.compileVM(function (assembler: Assembler) {
				assembler.record('meep', function (data: string, index: number, options: any) {
					return index + '-' + data.toUpperCase() + '-' + options.suffix;
				});
				assembler.accept();
			});
			const result = vm.execute(createInput([]), {suffix: 'BLA'});
			chai.expect(result.success).to.equal(true);
			chai.expect(result.acceptingTraces[0].records).to.deep.equal(['0-MEEP-BLA']);
		});
	});

	describe('reentrancy', () => {
		let vm: VM;
		function getVM (): VM {
			return vm;
		}
		beforeEach(() => {
			vm = whynot.compileVM(function (assembler: Assembler) {
				const stackFrame: any = {};
				assembler.test(function (item: any[]): boolean {
					stackFrame.info = getVM().execute(createInput(item));
					return true;
				});
				assembler.record(null, () => {
					return stackFrame.info;
				});
				assembler.jump([0, 3]);
				assembler.accept();
			});
		});

		function computeMaxDepth (result: Result): number {
			return result.acceptingTraces.reduce(function (max: number, trace: Trace) {
				console.group && console.group('accepting trace');
				const maxDepthForTrace = 1 + trace.records.reduce(function (max, result) {
					console.group && console.group('accepting record');
					const maxDepthForRecord = computeMaxDepth(result);
					console.groupEnd && console.groupEnd();
					return Math.max(maxDepthForRecord, max);
				}, 0);
				console.groupEnd && console.groupEnd();
				return Math.max(maxDepthForTrace, max);
			}, 0);
		}

		it('invoking a VM while executing does not disturb the outer execution', () => {
			const result = vm.execute(createInput([[[], []], [], [[[[]]], []]]));
			chai.expect(result.success).to.equal(true);
			chai.expect(computeMaxDepth(result)).to.equal(4);
		});
	});
});
