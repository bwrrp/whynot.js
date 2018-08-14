import Result from '../src/Result';
import Trace from '../src/Trace';

describe('Result', () => {
	it('can be successful', () => {
		const result = new Result([new Trace(null)], []);
		expect(result.success).toBe(true);
		expect(result.acceptingTraces.length).toBe(1);
		expect(result.failingTraces.length).toBe(0);
	});

	it('can be unsuccessful', () => {
		const result = new Result([], [new Trace(null)]);
		expect(result.success).toBe(false);
		expect(result.acceptingTraces.length).toBe(0);
		expect(result.failingTraces.length).toBe(1);
	});
});
