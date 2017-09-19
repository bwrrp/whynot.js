import Generation from '../src/Generation';
import Thread from '../src/Thread';

import * as chai from 'chai';

describe('Generation', () => {
	let generation: Generation;
	beforeEach(() => {
		generation = new Generation(10, [], 0);
	});

	describe('.reset()', () => {
		it('empties the Generation', () => {
			generation.reset(0);
			chai.expect(generation.getNextThread()).to.equal(null);
		});
	});

	describe('.addThread()', () => {
		describe('non-duplicate', () => {
			let addedThread: Thread | null;
			beforeEach(() => {
				addedThread = generation.addThread(0);
			});

			it('returns the thread', () => {
				chai.expect(addedThread).to.be.an.instanceOf(Thread);
			});

			it('returns the thread when scheduled', () => {
				const nextThread = generation.getNextThread();
				chai.expect(nextThread).to.equal(addedThread);
			});
		});

		describe('duplicate', () => {
			let rootThread: Thread;
			let forkLeft: Thread;
			let forkRight: Thread;
			beforeEach(() => {
				rootThread = generation.addThread(0) as Thread;
				forkLeft = generation.addThread(1, rootThread) as Thread;
				forkRight = generation.addThread(2, rootThread) as Thread;
			});

			it('joins non-repeating threads', () => {
				const joiningThread = generation.addThread(2, forkLeft);
				chai.expect(joiningThread).to.equal(null);
				chai.expect(forkRight.trace.prefixes.length).to.equal(2);
			});

			it('discards repeating threads', () => {
				const repeatingThread = generation.addThread(0, forkLeft);
				chai.expect(repeatingThread).to.equal(null);
				chai.expect(rootThread.trace.prefixes.length).to.equal(0);
			});
		});
	});

	describe('.getNextThread()', () => {
		type ThreadSpec = { pc: number; parent?: number; badness: number };
		function schedule(generation: Generation, threadSpecs: ThreadSpec[]) {
			const threads = [];
			for (let i = 0, l = threadSpecs.length; i < l; ++i) {
				const pc = threadSpecs[i].pc;
				const parentThread =
					threadSpecs[i].parent === undefined
						? null
						: threads[threadSpecs[i].parent as number];
				const badness = threadSpecs[i].badness;
				threads.push(generation.addThread(pc, parentThread || undefined, badness));
			}
		}

		function expectOrder(generation: Generation, threadSpecs: ThreadSpec[]) {
			for (let i = 0, l = threadSpecs.length; i < l; ++i) {
				const expectedPC = threadSpecs[i].pc;
				const expectedBadness = threadSpecs[i].badness;

				const nextThread = generation.getNextThread() as Thread;
				chai.expect(nextThread.pc).to.equal(expectedPC);
				chai.expect(nextThread.badness).to.equal(expectedBadness);
			}
		}

		it('should return threads with lower badness before higher ones', () => {
			schedule(generation, [
				{ pc: 0, parent: undefined, badness: 0 },
				{ pc: 1, parent: 0, badness: 1 },
				{ pc: 2, parent: 0, badness: 0 }
			]);
			expectOrder(generation, [
				{ pc: 0, badness: 0 },
				{ pc: 2, badness: 0 },
				{ pc: 1, badness: 1 }
			]);
		});

		it('should eventually yield all scheduled threads', () => {
			schedule(generation, [
				{ pc: 0, parent: undefined, badness: 1 },
				{ pc: 1, parent: 0, badness: 2 },
				{ pc: 2, parent: 0, badness: 1 }
			]);
			expectOrder(generation, [{ pc: 0, badness: 1 }]);
			schedule(generation, [
				{ pc: 3, parent: undefined, badness: 0 },
				{ pc: 4, parent: 0, badness: 2 },
				{ pc: 5, parent: 0, badness: 1 }
			]);
			expectOrder(generation, [
				{ pc: 3, badness: 0 },
				{ pc: 2, badness: 1 },
				{ pc: 5, badness: 1 },
				{ pc: 1, badness: 2 },
				{ pc: 4, badness: 2 }
			]);
		});
	});
});
