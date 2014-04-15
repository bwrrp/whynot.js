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
				generation = new Generation(4);
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
					it('joins non-repeating threads');
					it('discards repeating threads');
				});

				describe('badness scheduling', function() {
					it('should schedule threads with lower badness before higher ones');
					it('should schedule threads with higher badness after lower ones');
				});
			});

			describe('.getNextThread()', function() {
				it('should eventually yield all scheduled threads');
			});
		});
	}
);
