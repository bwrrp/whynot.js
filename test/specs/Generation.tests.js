define(
	[
		'whynot/Generation',
		'whynot/Thread'
	],
	function(
		Generation,
		Thread
		) {
		'use strict';

		describe('Generation', function() {
			var generation;
			beforeEach(function() {
				generation = new Generation(10);
			});

			describe('.reset()', function() {
				it('empties the Generation', function() {
					generation.reset();
					chai.expect(generation.getNextThread()).to.equal(null);
				});
			});

			describe('.addThread()', function() {
				describe('non-duplicate', function() {
					var addedThread;
					beforeEach(function() {
						addedThread = generation.addThread(0);
					});

					it('returns the thread', function() {
						chai.expect(addedThread).to.be.an.instanceOf(Thread);
					});

					it('returns the thread when scheduled', function() {
						var nextThread = generation.getNextThread();
						chai.expect(nextThread).to.equal(addedThread);
					});
				});

				describe('duplicate', function() {
					var rootThread,
						forkLeft,
						forkRight;
					beforeEach(function() {
						rootThread = generation.addThread(0);
						forkLeft = generation.addThread(1, rootThread);
						forkRight = generation.addThread(2, rootThread);
					});

					it('joins non-repeating threads', function() {
						var joiningThread = generation.addThread(2, forkLeft);
						chai.expect(joiningThread).to.equal(null);
						chai.expect(forkRight.trace.prefixes.length).to.equal(2);
					});

					it('discards repeating threads', function() {
						var repeatingThread = generation.addThread(0, forkLeft);
						chai.expect(repeatingThread).to.equal(null);
						chai.expect(rootThread.trace.prefixes.length).to.equal(0);
					});
				});
			});

			describe('.getNextThread()', function() {
				function schedule(generation, threadSpecs) {
					var threads = [];
					for (var i = 0, l = threadSpecs.length; i < l; ++i) {
						var pc = threadSpecs[i].pc,
							parentThread = threads[threadSpecs[i].parent],
							badness = threadSpecs[i].badness;
						threads.push(generation.addThread(pc, parentThread, badness));
					}
				}

				function expectOrder(generation, threadSpecs) {
					for (var i = 0, l = threadSpecs.length; i < l; ++i) {
						var expectedPC = threadSpecs[i].pc,
							expectedBadness = threadSpecs[i].badness;

						var nextThread = generation.getNextThread();
						chai.expect(nextThread.pc).to.equal(expectedPC);
						chai.expect(nextThread.badness).to.equal(expectedBadness);
					}
				}

				it('should return threads with lower badness before higher ones', function() {
					schedule(generation, [
						{pc: 0, parent: null, badness: 0},
						{pc: 1, parent: 0, badness: 1},
						{pc: 2, parent: 0, badness: 0}
					]);
					expectOrder(generation, [
						{pc: 0, badness: 0},
						{pc: 2, badness: 0},
						{pc: 1, badness: 1}
					]);
				});

				it('should eventually yield all scheduled threads', function() {
					schedule(generation, [
						{pc: 0, parent: null, badness: 1},
						{pc: 1, parent: 0, badness: 2},
						{pc: 2, parent: 0, badness: 1}
					]);
					expectOrder(generation, [
						{pc: 0, badness: 1}
					]);
					schedule(generation, [
						{pc: 3, parent: null, badness: 0},
						{pc: 4, parent: 0, badness: 2},
						{pc: 5, parent: 0, badness: 1}
					]);
					expectOrder(generation, [
						{pc: 3, badness: 0},
						{pc: 2, badness: 1},
						{pc: 5, badness: 1},
						{pc: 1, badness: 2},
						{pc: 4, badness: 2}
					]);
				});
			});
		});
	}
);
