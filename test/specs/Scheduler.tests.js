define(
	[
		'whynot/Scheduler',
		'whynot/Thread'
	],
	function(
		Scheduler,
		Thread
		) {
		'use strict';

		describe('Scheduler', function() {
			var scheduler;
			beforeEach(function() {
				scheduler = new Scheduler(2, 10, []);
			});

			describe('.reset()', function() {
				it('empties the Scheduler', function() {
					scheduler.reset();
					chai.expect(scheduler.getNextThread()).to.equal(null);
				});
			});

			describe('scheduling', function(){
				it('schedules threads in the current generation', function() {
					var rootThread = scheduler.addThread(0, 3, null, 123),
						currentGenThread = scheduler.getNextThread();
					chai.expect(currentGenThread).to.equal(rootThread);
					chai.expect(scheduler.getNextThread()).to.equal(null);

					scheduler.nextGeneration();

					chai.expect(scheduler.getNextThread()).to.equal(null);
				});

				it('schedules threads in a next generation', function() {
					var rootThread = scheduler.addThread(1, 3, null, 123);
					chai.expect(scheduler.getNextThread()).to.equal(null);

					scheduler.nextGeneration();

					var nextGenThread = scheduler.getNextThread();
					chai.expect(nextGenThread).to.equal(rootThread);
					chai.expect(scheduler.getNextThread()).to.equal(null);
				});

				it('increases badness for repeating threads', function() {
					var rootThread = scheduler.addThread(0, 0, null, 0),
						repeatingThread = scheduler.addThread(1, 0, rootThread, 0);

					chai.expect(repeatingThread.badness).to.be.above(0);
				});
			});
		});
	}
);
