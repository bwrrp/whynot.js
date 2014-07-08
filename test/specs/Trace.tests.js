define(
	[
		'whynot/Trace'
	],
	function(
		Trace
		) {
		'use strict';

		var PROGRAM_LENGTH = 10;

		describe('Trace', function() {
			describe('no preceding trace', function() {
				var trace;
				beforeEach(function() {
					trace = new Trace(4, PROGRAM_LENGTH);
				});

				it('has a head', function() {
					chai.expect(trace.head).to.deep.equal([4]);
				});

				it('has no records', function() {
					chai.expect(trace.records.length).to.equal(0);
				});

				it('has no prefixes', function() {
					chai.expect(trace.prefixes.length).to.equal(0);
				});

				describe('.compact()', function() {
					it('does not change the trace', function() {
						trace.compact();

						chai.expect(trace.head).to.deep.equal([4]);
						chai.expect(trace.records.length).to.equal(0);
						chai.expect(trace.prefixes.length).to.equal(0);
					});
				});
			});

			describe('single preceding trace', function() {
				var rootTrace,
					trace;
				beforeEach(function() {
					rootTrace = new Trace(1, PROGRAM_LENGTH);
					trace = new Trace(4, PROGRAM_LENGTH, rootTrace);
				});

				it('has a head', function() {
					chai.expect(trace.head).to.deep.equal([4]);
				});

				it('has no records', function() {
					chai.expect(trace.records.length).to.equal(0);
				});

				it('has a single prefix', function() {
					chai.expect(trace.prefixes.length).to.equal(1);
					chai.expect(trace.prefixes[0].head).to.deep.equal([1]);
				});

				describe('.compact()', function() {
					it('combines the traces', function() {
						trace.compact();

						chai.expect(trace.head).to.deep.equal([1, 4]);
						chai.expect(trace.records.length).to.equal(0);
						chai.expect(trace.prefixes.length).to.equal(0);
					});

					describe('with records', function() {
						beforeEach(function() {
							rootTrace.records.push('bla');
							trace.records.push('meep');
						});

						it('combines the traces', function() {
							trace.compact();

							chai.expect(trace.head).to.deep.equal([1, 4]);
							chai.expect(trace.records).to.deep.equal(['bla', 'meep']);
							chai.expect(trace.prefixes.length).to.equal(0);
						});
					});
				});
			});

			describe('multiple preceding traces', function() {
				var rootTrace,
					otherRootTrace,
					trace;
				beforeEach(function() {
					rootTrace = new Trace(1, PROGRAM_LENGTH);
					otherRootTrace = new Trace(2, PROGRAM_LENGTH);
					trace = new Trace(4, PROGRAM_LENGTH, rootTrace);

					trace.prefixes.push(otherRootTrace);
				});

				it('has a head', function() {
					chai.expect(trace.head).to.deep.equal([4]);
				});

				it('has no records', function() {
					chai.expect(trace.records.length).to.equal(0);
				});

				it('has a two prefixes', function() {
					chai.expect(trace.prefixes.length).to.equal(2);
					chai.expect(trace.prefixes[0].head).to.deep.equal([1]);
					chai.expect(trace.prefixes[1].head).to.deep.equal([2]);
				});

				describe('.compact()', function() {
					it('does not change the trace', function() {
						trace.compact();

						chai.expect(trace.head).to.deep.equal([4]);
						chai.expect(trace.records.length).to.equal(0);
						chai.expect(trace.prefixes.length).to.equal(2);
					});
				});
			});
		});
	}
);
