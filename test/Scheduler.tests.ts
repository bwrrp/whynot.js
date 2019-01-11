import ProgramInfo from '../src/ProgramInfo';
import Scheduler from '../src/Scheduler';
import Trace from '../src/Trace';

describe('Scheduler', () => {
	let scheduler: Scheduler<string>;
	beforeEach(() => {
		scheduler = new Scheduler(ProgramInfo.createStub(10));
		scheduler.reset();
	});

	describe('.reset()', () => {
		it('resets the Scheduler to the starting thread', () => {
			scheduler.reset();
			expect(scheduler.getNextThreadPc()).toBe(0);
			expect(scheduler.getNextThreadPc()).toBe(null);
		});
	});

	describe('.step()', () => {
		it('schedules threads in the current generation', () => {
			scheduler.step(0, 1, 0);
			expect(scheduler.getNextThreadPc()).toBe(0);
			expect(scheduler.getNextThreadPc()).toBe(1);
			expect(scheduler.getNextThreadPc()).toBe(null);

			scheduler.nextGeneration();
			expect(scheduler.getNextThreadPc()).toBe(null);
		});

		it('reschedules if there is already a thread at the target pc', () => {
			scheduler.step(0, 1, 0);
			scheduler.step(0, 2, 1);
			scheduler.step(0, 1, 2);
			expect(scheduler.getNextThreadPc()).toBe(0);
			expect(scheduler.getNextThreadPc()).toBe(2);
			expect(scheduler.getNextThreadPc()).toBe(1);
			expect(scheduler.getNextThreadPc()).toBe(null);

			scheduler.nextGeneration();
			expect(scheduler.getNextThreadPc()).toBe(null);
		});
	});

	describe('.stepToNextGeneration()', () => {
		it('schedules threads in a next generation', () => {
			scheduler.stepToNextGeneration(0, 1);
			expect(scheduler.getNextThreadPc()).toBe(0);
			expect(scheduler.getNextThreadPc()).toBe(null);

			scheduler.nextGeneration();

			expect(scheduler.getNextThreadPc()).toBe(1);
			expect(scheduler.getNextThreadPc()).toBe(null);
		});

		it('reschedules if there is already a thread at the target pc', () => {
			scheduler.step(0, 2, 5);
			scheduler.stepToNextGeneration(0, 1);
			scheduler.stepToNextGeneration(0, 2);
			scheduler.stepToNextGeneration(2, 1);

			expect(scheduler.getNextThreadPc()).toBe(0);
			expect(scheduler.getNextThreadPc()).toBe(2);
			expect(scheduler.getNextThreadPc()).toBe(null);

			scheduler.nextGeneration();

			expect(scheduler.getNextThreadPc()).toBe(2);
			expect(scheduler.getNextThreadPc()).toBe(1);
			expect(scheduler.getNextThreadPc()).toBe(null);
		});
	});

	describe('.accept()', () => {
		it('marks an accepted trace to be returned by getAcceptingTraces()', () => {
			scheduler.accept(0);
			expect(scheduler.getAcceptingTraces().length).toBe(1);
		});
	});

	describe('.fail()', () => {
		it('does not do anything yet', () => {
			expect(scheduler.getNextThreadPc()).toBe(0);
			scheduler.fail(0);
			expect(scheduler.getNextThreadPc()).toBe(null);
		});
	});

	describe('.record()', () => {
		it('marks a recorded value for a pc, to be included in accepted traces past that pc', () => {
			scheduler.record(0, '123');
			scheduler.accept(0);
			scheduler.nextGeneration();
			const traces = scheduler.getAcceptingTraces();
			expect(traces.length).toBe(1);
			expect(traces[0].record).toEqual('123');
		});
	});

	describe('.nextGeneration()', () => {
		it('moves to the next generation', () => {
			scheduler.step(0, 1, 0);
			scheduler.nextGeneration();
			expect(scheduler.getNextThreadPc()).toBe(null);
			scheduler.nextGeneration();
			expect(scheduler.getNextThreadPc()).toBe(null);
		});

		it('throws if a path can not be traced back to the initial instruction', () => {
			expect(scheduler.getNextThreadPc()).toBe(0);
			scheduler.step(1, 2, 0);
			expect(scheduler.getNextThreadPc()).toBe(2);
			scheduler.accept(2);
			expect(scheduler.getNextThreadPc()).toBe(null);
			expect(() => scheduler.nextGeneration()).toThrow('Trace without source at pc 1');
		});
	});

	describe('.getAcceptingTraces()', () => {
		function* enumeratePaths(trace: Trace<string>): IterableIterator<string[]> {
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

		it('builds traces over all completed generations', () => {
			expect(scheduler.getNextThreadPc()).toBe(0);
			scheduler.record(0, 'test');
			scheduler.step(0, 1, 0);
			scheduler.step(0, 3, 0);
			scheduler.step(0, 4, 0);
			expect(scheduler.getNextThreadPc()).toBe(1);
			scheduler.record(1, 'branch 1');
			scheduler.stepToNextGeneration(1, 2);
			expect(scheduler.getNextThreadPc()).toBe(3);
			scheduler.record(3, 'branch 2');
			scheduler.stepToNextGeneration(3, 2);
			expect(scheduler.getNextThreadPc()).toBe(4);
			scheduler.record(4, 'branch 3');
			scheduler.stepToNextGeneration(4, 5);
			expect(scheduler.getNextThreadPc()).toBe(null);
			scheduler.nextGeneration();

			expect(scheduler.getNextThreadPc()).toBe(2);
			scheduler.record(2, 'next generation');
			scheduler.step(2, 3, 0);
			expect(scheduler.getNextThreadPc()).toBe(5);
			scheduler.record(5, 'next generation (2)');
			scheduler.accept(5);
			expect(scheduler.getNextThreadPc()).toBe(3);
			scheduler.accept(3);
			expect(scheduler.getNextThreadPc()).toBe(null);
			scheduler.nextGeneration();

			const traces = scheduler.getAcceptingTraces();
			expect(
				traces.reduce(
					(paths: string[][], trace: Trace<string>) =>
						paths.concat(Array.from(enumeratePaths(trace))),
					[]
				)
			).toEqual([
				['test', 'branch 3', 'next generation (2)'],
				['test', 'branch 1', 'next generation'],
				['test', 'branch 2', 'next generation']
			]);
		});

		it('returns unique traces only', () => {
			// This simulates the following program, with one input item
			// (tests only succeed in the first generation accepts in the second):
			// jump -> test -> jump -> test -> accept
			//  \______________/  \_____________/

			expect(scheduler.getNextThreadPc()).toBe(0);
			scheduler.step(0, 1, 0);
			scheduler.step(0, 2, 0);
			expect(scheduler.getNextThreadPc()).toBe(1);
			scheduler.stepToNextGeneration(1, 2);
			expect(scheduler.getNextThreadPc()).toBe(2);
			scheduler.step(2, 3, 0);
			scheduler.step(2, 4, 0);
			expect(scheduler.getNextThreadPc()).toBe(3);
			scheduler.stepToNextGeneration(3, 4);
			expect(scheduler.getNextThreadPc()).toBe(4);
			scheduler.fail(4);
			expect(scheduler.getNextThreadPc()).toBe(null);
			scheduler.nextGeneration();

			expect(scheduler.getNextThreadPc()).toBe(2);
			scheduler.step(2, 3, 0);
			scheduler.step(2, 4, 0);
			expect(scheduler.getNextThreadPc()).toBe(4);
			scheduler.accept(4);
			expect(scheduler.getNextThreadPc()).toBe(3);
			scheduler.fail(3);
			expect(scheduler.getNextThreadPc()).toBe(null);
			scheduler.nextGeneration();

			expect(scheduler.getNextThreadPc()).toBe(null);

			const traces = scheduler.getAcceptingTraces();
			expect(traces[0]).toBe(Trace.EMPTY);
			expect(
				traces.reduce(
					(paths: string[][], trace: Trace<string>) =>
						paths.concat(Array.from(enumeratePaths(trace))),
					[]
				)
			).toEqual([[]]);
		});
	});
});
