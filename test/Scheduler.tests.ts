import Scheduler from '../src/Scheduler';
import Thread from '../src/Thread';

import * as chai from 'chai';

describe('Scheduler', () => {
	let scheduler: Scheduler;
	beforeEach(() => {
		scheduler = new Scheduler(2, 10, []);
	});

	describe('.reset()', () => {
		it('empties the Scheduler', () => {
			scheduler.reset();
			chai.expect(scheduler.getNextThread()).to.equal(null);
		});
	});

	describe('scheduling', () => {
		it('schedules threads in the current generation', () => {
			const rootThread = scheduler.addThread(0, 3, undefined, 123);
			const currentGenThread = scheduler.getNextThread();
			chai.expect(currentGenThread).to.equal(rootThread);
			chai.expect(scheduler.getNextThread()).to.equal(null);

			scheduler.nextGeneration();

			chai.expect(scheduler.getNextThread()).to.equal(null);
		});

		it('schedules threads in a next generation', () => {
			const rootThread = scheduler.addThread(1, 3, undefined, 123);
			chai.expect(scheduler.getNextThread()).to.equal(null);

			scheduler.nextGeneration();

			var nextGenThread = scheduler.getNextThread();
			chai.expect(nextGenThread).to.equal(rootThread);
			chai.expect(scheduler.getNextThread()).to.equal(null);
		});
	});
});
