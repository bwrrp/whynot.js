define(
	[
		'whynot/Thread'
	],
	function(
		Thread
		) {
		'use strict';

		describe('Thread', function() {
			describe('no preceding thread', function() {
				var thread;
				beforeEach(function() {
					thread = new Thread(4, null, 123);
				});

				it('has a program counter', function() {
					chai.expect(thread.pc).to.equal(4);
				});

				it('has badness', function() {
					chai.expect(thread.badness).to.equal(123);
				});

				it('has a root trace', function() {
					chai.expect(thread.trace.prefixes.length).to.equal(0);
				});
			});

			describe('single preceding thread', function() {
				var rootThread,
					thread;
				beforeEach(function() {
					rootThread = new Thread(1, null, 123);
					thread = new Thread(4, rootThread, 456);
				});

				it('has a program counter', function() {
					chai.expect(thread.pc).to.equal(4);
				});

				it('has badness', function() {
					chai.expect(thread.badness).to.equal(456);
				});

				it('has a prefixed trace', function() {
					chai.expect(thread.trace.prefixes.length).to.equal(1);
				});
			});

			describe('.join()', function() {
				var rootThread,
					otherRootThread,
					thread;
				beforeEach(function() {
					rootThread = new Thread(1, null, 123);
					otherRootThread = new Thread(2, null, 234);
					thread = new Thread(4, rootThread, 456);

					thread.join(otherRootThread, 789);
				});

				it('has a program counter', function() {
					chai.expect(thread.pc).to.equal(4);
				});

				it('has maximum badness', function() {
					chai.expect(thread.badness).to.equal(789);
				});

				it('has a double-prefixed trace', function() {
					chai.expect(thread.trace.prefixes.length).to.equal(2);
				});
			});
		});
	}
);
