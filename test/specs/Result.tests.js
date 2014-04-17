define(
	[
		'whynot/Result',
		'whynot/Trace'
	],
	function(
		Result,
		Trace
		) {
		'use strict';

		describe('Result', function() {
			it('can be successful', function() {
				var result = new Result([new Trace(0)], []);
				chai.expect(result.success).to.equal(true);
				chai.expect(result.acceptingTraces.length).to.equal(1);
				chai.expect(result.failingTraces.length).to.equal(0);
			});

			it('can be unsuccessful', function() {
				var result = new Result([], [new Trace(0)]);
				chai.expect(result.success).to.equal(false);
				chai.expect(result.acceptingTraces.length).to.equal(0);
				chai.expect(result.failingTraces.length).to.equal(1);
			});
		});
	}
);
