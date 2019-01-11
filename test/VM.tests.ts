import Result from '../src/Result';
import Trace from '../src/Trace';
import { VM, default as whynot } from '../src/index';

describe('VM', () => {
	function flattenTrace<TRecord>(
		trace: Trace<TRecord>,
		records: TRecord[] = [],
		flatTraces: TRecord[][] = []
	) {
		const combinedRecords = trace.record === null ? records : [trace.record].concat(records);
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
		let vm: VM<number, void>;
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
		});
	});

	describe('fail', () => {
		describe('unconditional', () => {
			let vm: VM<number, void>;
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
			let vm: VM<number, void>;
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
				const resultWithInput = vm.execute([1]);
				expect(resultWithInput.success).toBe(false);
			});

			it('continues the thread if the condition predicate returns false', () => {
				condition = false;
				const resultWithoutInput = vm.execute([]);
				expect(resultWithoutInput.success).toBe(true);
				expect(resultWithoutInput.acceptingTraces.length).toEqual(1);
				const resultWithInput = vm.execute([1]);
				expect(resultWithInput.success).toBe(false);
			});
		});

		describe('conditional with options', () => {
			type Options = { shouldFail: boolean };
			let vm: VM<number, void, Options>;
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
				const resultWithInput = vm.execute([1], { shouldFail: true });
				expect(resultWithInput.success).toBe(false);
			});

			it('continues the thread if the condition predicate returns false', () => {
				const resultWithoutInput = vm.execute([], { shouldFail: false });
				expect(resultWithoutInput.success).toBe(true);
				expect(resultWithoutInput.acceptingTraces.length).toEqual(1);
				const resultWithInput = vm.execute([1], { shouldFail: false });
				expect(resultWithInput.success).toBe(false);
			});
		});
	});

	describe('bad', () => {
		let vmLeftBad: VM<void, string>;
		let vmRightBad: VM<void, string>;
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

		let vm: VM<string, void>;
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
		});

		describe('with options', () => {
			type Options = { shouldAccept: boolean };
			let vm: VM<string, void, Options>;
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

		it('fails the thread when given no targets', () => {
			const vm = whynot.compileVM(assembler => {
				assembler.jump([]);
				assembler.accept();
			});
			const result = vm.execute([]);
			expect(result.success).toBe(false);
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
			expect(result.acceptingTraces[0].record).toEqual('meep');
		});

		it('can use a recorder callback', () => {
			const vm = whynot.compileVM<void, string>(assembler => {
				assembler.record('meep', function(data: string, index: number) {
					return index + '-' + data.toUpperCase();
				});
				assembler.accept();
			});
			const result = vm.execute([]);
			expect(result.success).toBe(true);
			expect(result.acceptingTraces[0].record).toEqual('0-MEEP');
		});

		it('can use options in the recorder callback', () => {
			type Options = { suffix: string };
			const vm = whynot.compileVM<void, string, Options>(assembler => {
				assembler.record('meep', function(data: string, index: number, options: any) {
					return index + '-' + data.toUpperCase() + '-' + options.suffix;
				});
				assembler.accept();
			});
			const result = vm.execute([], { suffix: 'BLA' });
			expect(result.success).toBe(true);
			expect(result.acceptingTraces[0].record).toEqual('0-MEEP-BLA');
		});

		it('ignores null records', () => {
			const vm = whynot.compileVM<void, any>(assembler => {
				assembler.record('meep', () => null);
				assembler.accept();
			});
			const result = vm.execute([]);
			expect(result.success).toBe(true);
			expect(result.acceptingTraces[0].record).toEqual(null);
		});
	});

	describe('repetition', () => {
		function* enumeratePaths<TRecord>(trace: Trace<TRecord>): IterableIterator<TRecord[]> {
			if (trace.prefixes.length === 0) {
				yield trace.record === null ? [] : [trace.record];
				return;
			}
			for (const prefix of trace.prefixes) {
				for (const path of enumeratePaths(prefix)) {
					yield trace.record === null ? path : path.concat([trace.record]);
				}
			}
		}

		it('can return unique traces for a program with repetition', () => {
			// Run the following program with three input items:
			// ,--------------------------------------------------------.
			// `-> 0:jump -> 1:jump -> 2:test -> 3:rec. -> 4:jump -,-> 6:jump
			//      \         `----> 5:rec. ----------------------'
			//       `-> 7:accept
			const vm = whynot.compileVM<number, string>(assembler => {
				assembler.jump([1, 7]);
				assembler.jump([2, 5]);
				assembler.test(() => true);
				assembler.record('T');
				assembler.jump([6]);
				assembler.record('M');
				assembler.jump([0]);
				assembler.accept();
			});
			const result = vm.execute([1, 2, 3]);
			expect(result.success).toBe(true);
			expect(
				result.acceptingTraces.reduce(
					(paths: string[][], trace: Trace<string>) =>
						paths.concat(Array.from(enumeratePaths(trace))),
					[]
				)
			).toEqual([['T', 'T', 'T']]);
		});

		it('can return unique traces for a program with multiple paths and badness', () => {
			// Run the following program with one to three input items:
			// With N being the following:
			// 0:jump -> 1:test -> 2:record -> 3:jump -,->
			//  `----> 4:record -> 5:bad -------------'
			// The program is:
			// 0:N -> 6:N -> 12:jump -> 13:N -,-> 19:accept
			//                 `-------------'
			const vm = whynot.compileVM<number, string>(assembler => {
				// 0:N
				assembler.jump([1, 4]);
				assembler.test(() => true);
				assembler.record('T1');
				assembler.jump([6]);
				assembler.record('M1');
				assembler.bad(1);

				// 6:N
				assembler.jump([7, 10]);
				assembler.test(() => true);
				assembler.record('T2');
				assembler.jump([12]);
				assembler.record('M2');
				assembler.bad(1);

				// 12:jump
				assembler.jump([13, 19]);

				// 13:N
				assembler.jump([14, 17]);
				assembler.test(() => true);
				assembler.record('T3');
				assembler.jump([19]);
				assembler.record('M3');
				assembler.bad(1);

				// 19:accept
				assembler.accept();
			});
			const result = vm.execute([1, 2]);
			expect(result.success).toBe(true);
			expect(
				result.acceptingTraces.reduce(
					(paths: string[][], trace: Trace<string>) =>
						paths.concat(Array.from(enumeratePaths(trace))),
					[]
				)
			).toEqual([['T1', 'T2'], ['T1', 'T2', 'M3'], ['T1', 'M2', 'T3'], ['M1', 'T2', 'T3']]);
		});
	});

	describe('reentrancy', () => {
		let vm: VM<any[], Result<any>>;
		beforeEach(() => {
			vm = whynot.compileVM(assembler => {
				const stackFrame: { info?: Result<any> } = {};
				assembler.test(item => {
					stackFrame.info = vm.execute(item);
					return true;
				});
				assembler.record(null, () => {
					return stackFrame.info;
				});
				assembler.jump([0, 3]);
				assembler.accept();
			});
		});

		function* getRecordsForTrace(trace: Trace<Result<any>>): IterableIterator<Result<any>> {
			if (trace.record !== null) {
				yield trace.record;
			}
			for (const prefix of trace.prefixes) {
				for (const record of getRecordsForTrace(prefix)) {
					yield record;
				}
			}
		}

		function computeMaxDepth(result: Result<Result<any>>): number {
			return result.acceptingTraces.reduce(function(max: number, trace: Trace<Result<any>>) {
				const maxDepthForTrace =
					1 +
					[...getRecordsForTrace(trace)].reduce(function(max, result) {
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
