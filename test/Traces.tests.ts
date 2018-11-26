import Traces from '../src/Traces';

describe('Traces', () => {
	let traces: Traces;
	beforeEach(() => {
		traces = new Traces(10);
	});

	describe('.reset()', () => {
		it('clears recorded information', () => {
			traces.add(0, 1);
			traces.reset(true);
			expect(traces.has(1)).toBe(false);
		});
	});

	describe('.record()', () => {
		it('adds a record to be included in traces that include the corresponding pc', () => {
			traces.record(0, 123);
			// TODO: check traces
		});
	});

	describe('.has()', () => {
		it('returns whether the trace has incoming steps for the given pc', () => {
			traces.add(0, 1);
			traces.add(1, 2);
			traces.add(0, 2);
			traces.add(3, 4);
			expect(traces.has(1)).toBe(true);
			expect(traces.has(2)).toBe(true);
			expect(traces.has(3)).toBe(false);
		});

		it('also returns true if the trace has an incoming survivor', () => {
			expect(traces.has(0)).toBe(true);
			traces.addSurvivor(0, 1);
			traces.buildSurvivorTraces();
			traces.reset(false);
			expect(traces.has(0)).toBe(false);
			expect(traces.has(1)).toBe(true);
		});
	});

	describe('.hasSurvivor()', () => {
		it('returns whether the given pc is a survivor', () => {
			traces.addSurvivor(0, 1);
			expect(traces.hasSurvivor(0)).toBe(false);
			expect(traces.hasSurvivor(1)).toBe(true);
			expect(traces.hasSurvivor(2)).toBe(false);
			expect(traces.has(1)).toBe(false);
		});
	});
});
