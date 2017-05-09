import Result from '../src/Result';
import Trace from '../src/Trace';

import * as chai from 'chai';

describe('Result', () => {
	it('can be successful', () => {
		var result = new Result([new Trace(0, 0, null, 0)], []);
		chai.expect(result.success).to.equal(true);
		chai.expect(result.acceptingTraces.length).to.equal(1);
		chai.expect(result.failingTraces.length).to.equal(0);
	});

	it('can be unsuccessful', () => {
		var result = new Result([], [new Trace(0, 0, null, 0)]);
		chai.expect(result.success).to.equal(false);
		chai.expect(result.acceptingTraces.length).to.equal(0);
		chai.expect(result.failingTraces.length).to.equal(1);
	});
});
