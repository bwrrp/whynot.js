import Result from '../src/Result';
import Trace from '../src/Trace';
import { VM, default as whynot } from '../src/index';

describe('VM', () => {
	function flattenTrace(trace: Trace, records: number[] = [], flatTraces: number[][] = []) {
		const combinedRecords = trace.records === null ? records : trace.records.concat(records);
		if (!trace.prefixes.length) {
			flatTraces.push(combinedRecords);
		} else {
			for (let i = 0, l = trace.prefixes.length; i < l; ++i) {
				flattenTrace(trace.prefixes[i], combinedRecords, flatTraces);
			}
		}
		return flatTraces;
	}

	describe('accept', () => {
		let vm: VM<number>;
		beforeEach(() => {
			vm = whynot.compileVM(assembler => {
				assembler.accept();
			});
		});

		it('generates an accepting trace at the end of input', () => {
			const result = vm.execute([]);
			expect(result.success).toBe(true);
			expect(result.acceptingTraces.length).toBe(1);
		});

		it('fails when invoked with current input', () => {
			const result = vm.execute([1]);
			expect(result.success).toBe(false);
			expect(result.acceptingTraces.length).toBe(0);
			expect(result.failingTraces.length).toBeGreaterThan(0);
		});
	});

	describe('fail', () => {
		describe('unconditional', () => {
			let vm: VM<number>;
			beforeEach(() => {
				vm = whynot.compileVM(assembler => {
					assembler.fail();
				});
			});

			it('ends the thread', () => {
				expect(vm.execute([]).success).toBe(false);
				expect(vm.execute([1]).success).toBe(false);
			});
		});

		describe('conditional', () => {
			let vm: VM<number>;
			let condition: boolean;
			beforeEach(() => {
				vm = whynot.compileVM(assembler => {
					assembler.fail(() => {
						return condition;
					});
					assembler.accept();
				});
				condition = false;
			});

			it('ends the thread if the condition predicate returns true', () => {
				condition = true;
				const resultWithoutInput = vm.execute([]);
				expect(resultWithoutInput.success).toBe(false);
				expect(resultWithoutInput.failingTraces.length).toEqual(1);
				const resultWithInput = vm.execute([1]);
				expect(resultWithInput.success).toBe(false);
				expect(resultWithInput.failingTraces.length).toEqual(1);
			});

			it('continues the thread if the condition predicate returns false', () => {
				condition = false;
				const resultWithoutInput = vm.execute([]);
				expect(resultWithoutInput.success).toBe(true);
				expect(resultWithoutInput.acceptingTraces.length).toEqual(1);
				const resultWithInput = vm.execute([1]);
				expect(resultWithInput.success).toBe(false);
				expect(resultWithInput.failingTraces.length).toEqual(1);
			});
		});

		describe('conditional with options', () => {
			type Options = { shouldFail: boolean };
			let vm: VM<number, Options>;
			beforeEach(() => {
				vm = whynot.compileVM(assembler => {
					assembler.fail(function(options) {
						return !!options && options.shouldFail;
					});
					assembler.accept();
				});
			});

			it('ends the thread if the condition predicate returns true', () => {
				const resultWithoutInput = vm.execute([], { shouldFail: true });
				expect(resultWithoutInput.success).toBe(false);
				expect(resultWithoutInput.failingTraces.length).toEqual(1);
				const resultWithInput = vm.execute([1], { shouldFail: true });
				expect(resultWithInput.success).toBe(false);
				expect(resultWithInput.failingTraces.length).toEqual(1);
			});

			it('continues the thread if the condition predicate returns false', () => {
				const resultWithoutInput = vm.execute([], { shouldFail: false });
				expect(resultWithoutInput.success).toBe(true);
				expect(resultWithoutInput.acceptingTraces.length).toEqual(1);
				const resultWithInput = vm.execute([1], { shouldFail: false });
				expect(resultWithInput.success).toBe(false);
				expect(resultWithInput.failingTraces.length).toEqual(1);
			});
		});
	});

	describe('bad', () => {
		let vmLeftBad: VM<void>;
		let vmRightBad: VM<void>;
		beforeEach(() => {
			// Create two branches of equal length, one badness 1, the other 0
			vmLeftBad = whynot.compileVM(assembler => {
				assembler.jump([1, 4]); // 0
				assembler.bad(100); // 1
				assembler.record('A'); // 2
				assembler.jump([7]); // 3
				assembler.bad(1); // 4
				assembler.record('B'); // 5
				assembler.jump([7]); // 6
				assembler.accept(); // 7
			});
			vmRightBad = whynot.compileVM(assembler => {
				assembler.jump([1, 4]); // 0
				assembler.bad(1); // 1
				assembler.record('A'); // 2
				assembler.jump([7]); // 3
				assembler.bad(100); // 4
				assembler.record('B'); // 5
				assembler.jump([7]); // 6
				assembler.accept(); // 7
			});
		});

		it('lowers thread priority by its cost', () => {
			debugger;
			const leftResult = vmLeftBad.execute([]);
			const rightResult = vmRightBad.execute([]);
			expect(flattenTrace(leftResult.acceptingTraces[0])).toEqual([['B'], ['A']]);
			expect(flattenTrace(rightResult.acceptingTraces[0])).toEqual([['A'], ['B']]);
		});
	});

	describe('test', () => {
		function isMeep(item: string) {
			return item === 'meep';
		}

		let vm: VM<string>;
		beforeEach(() => {
			vm = whynot.compileVM(assembler => {
				assembler.test(isMeep);
				assembler.accept();
			});
		});

		it('moves a thread to the next generation when the test succeeds', () => {
			const result = vm.execute(['meep']);
			expect(result.success).toBe(true);
			expect(result.acceptingTraces.length).toBe(1);
		});

		it('ends the thread when the test fails', () => {
			const result = vm.execute(['bla']);
			expect(result.success).toBe(false);
			expect(result.acceptingTraces.length).toBe(0);
			expect(result.failingTraces.length).toBe(1);
		});

		describe('with options', () => {
			type Options = { shouldAccept: boolean };
			let vm: VM<string, Options>;
			beforeEach(() => {
				vm = whynot.compileVM(assembler => {
					assembler.test(function(_item: string, _data: any, options: any) {
						return options.shouldAccept;
					});
					assembler.accept();
				});
			});

			it('moves a thread to the next generation when the test succeeds', () => {
				const result = vm.execute(['meep'], { shouldAccept: true });
				expect(result.success).toBe(true);
				expect(result.acceptingTraces.length).toBe(1);
			});

			it('ends the thread when the test fails', () => {
				const result = vm.execute(['meep'], { shouldAccept: false });
				expect(result.success).toBe(false);
				expect(result.acceptingTraces.length).toBe(0);
				expect(result.failingTraces.length).toBe(1);
			});
		});
	});

	describe('jump', () => {
		it('can create a single new thread', () => {
			const vm = whynot.compileVM(assembler => {
				assembler.jump([1]);
				assembler.accept();
			});
			const result = vm.execute([]);
			expect(result.success).toBe(true);
		});

		it('can create multiple new threads', () => {
			const vm = whynot.compileVM(assembler => {
				assembler.jump([1, 2]);
				assembler.accept();
				assembler.accept();
			});
			const result = vm.execute([]);
			expect(result.success).toBe(true);
			expect(result.acceptingTraces.length).toBe(2);
		});
	});

	describe('record', () => {
		it('can record static data', () => {
			const vm = whynot.compileVM(assembler => {
				assembler.record('meep');
				assembler.accept();
			});
			const result = vm.execute([]);
			expect(result.success).toBe(true);
			expect(result.acceptingTraces[0].records).toEqual(['meep']);
		});

		it('can use a recorder callback', () => {
			const vm = whynot.compileVM(assembler => {
				assembler.record('meep', function(data: string, index: number) {
					return index + '-' + data.toUpperCase();
				});
				assembler.accept();
			});
			const result = vm.execute([]);
			expect(result.success).toBe(true);
			expect(result.acceptingTraces[0].records).toEqual(['0-MEEP']);
		});

		it('can use options in the recorder callback', () => {
			type Options = { suffix: string };
			const vm = whynot.compileVM<void, Options>(assembler => {
				assembler.record('meep', function(data: string, index: number, options: any) {
					return index + '-' + data.toUpperCase() + '-' + options.suffix;
				});
				assembler.accept();
			});
			const result = vm.execute([], { suffix: 'BLA' });
			expect(result.success).toBe(true);
			expect(result.acceptingTraces[0].records).toEqual(['0-MEEP-BLA']);
		});
	});

	describe('reentrancy', () => {
		let vm: VM<any[]>;
		function getVM(): VM<any[]> {
			return vm;
		}
		beforeEach(() => {
			vm = whynot.compileVM(assembler => {
				const stackFrame: { info?: Result } = {};
				assembler.test(item => {
					stackFrame.info = getVM().execute(item);
					return true;
				});
				assembler.record(null, () => {
					return stackFrame.info;
				});
				assembler.jump([0, 3]);
				assembler.accept();
			});
		});

		function computeMaxDepth(result: Result): number {
			return result.acceptingTraces.reduce(function(max: number, trace: Trace) {
				const maxDepthForTrace =
					1 +
					trace.records!.reduce(function(max, result) {
						const maxDepthForRecord = computeMaxDepth(result);
						return Math.max(maxDepthForRecord, max);
					}, 0);
				return Math.max(maxDepthForTrace, max);
			}, 0);
		}

		it('invoking a VM while executing does not disturb the outer execution', () => {
			const result = vm.execute([[[], []], [], [[[[]]], []]]);
			expect(result.success).toBe(true);
			expect(computeMaxDepth(result)).toBe(4);
		});
	});
});
