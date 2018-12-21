import Scheduler from '../src/Scheduler';

describe('Scheduler', () => {
	let scheduler: Scheduler;
	beforeEach(() => {
		scheduler = new Scheduler(2, 10, []);
	});

	describe('.reset()', () => {
		it('empties the Scheduler', () => {
			scheduler.reset();
			expect(scheduler.getNextThread()).toBe(null);
		});
	});

	describe('scheduling', () => {
		it('schedules threads in the current generation', () => {
			const rootThread = scheduler.addThread(0, 3, undefined, 123);
			const currentGenThread = scheduler.getNextThread();
			expect(currentGenThread).toBe(rootThread);
			expect(scheduler.getNextThread()).toBe(null);

			scheduler.nextGeneration();

			expect(scheduler.getNextThread()).toBe(null);
		});

		it('schedules threads in a next generation', () => {
			const rootThread = scheduler.addThread(1, 3, undefined, 123);
			expect(scheduler.getNextThread()).toBe(null);

			scheduler.nextGeneration();

			var nextGenThread = scheduler.getNextThread();
			expect(nextGenThread).toBe(rootThread);
			expect(scheduler.getNextThread()).toBe(null);
		});
	});
});
