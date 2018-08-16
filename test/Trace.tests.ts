import Trace from '../src/Trace';

const PROGRAM_LENGTH = 10;

describe('Trace', () => {
	describe('no preceding trace', () => {
		let trace: Trace;
		beforeEach(() => {
			trace = new Trace(null);
		});

		it('has no records', () => {
			expect(trace.records.length).toBe(0);
		});

		it('has no prefixes', () => {
			expect(trace.prefixes.length).toBe(0);
		});

		describe('.compact()', () => {
			it('does not change the trace', () => {
				trace.compact();

				expect(trace.records.length).toBe(0);
				expect(trace.prefixes.length).toBe(0);
			});
		});
	});

	describe('single preceding trace', () => {
		let rootTrace: Trace;
		let trace: Trace;
		beforeEach(() => {
			rootTrace = new Trace(null);
			trace = new Trace(rootTrace);
		});

		it('has no records', () => {
			expect(trace.records.length).toBe(0);
		});

		it('has a single prefix', () => {
			expect(trace.prefixes.length).toBe(1);
		});

		describe('.compact()', () => {
			it('combines the traces', () => {
				trace.compact();

				expect(trace.records.length).toBe(0);
				expect(trace.prefixes.length).toBe(0);
			});

			describe('with records', () => {
				beforeEach(() => {
					rootTrace.records.push('bla');
					trace.records.push('meep');
				});

				it('combines the traces', () => {
					trace.compact();

					expect(trace.records).toEqual(['bla', 'meep']);
					expect(trace.prefixes.length).toBe(0);
				});
			});
		});
	});

	describe('multiple preceding traces', () => {
		let rootTrace: Trace;
		let otherRootTrace: Trace;
		let trace: Trace;
		beforeEach(() => {
			rootTrace = new Trace(null);
			otherRootTrace = new Trace(null);
			trace = new Trace(rootTrace);

			trace.prefixes.push(otherRootTrace);
		});

		it('has no records', () => {
			expect(trace.records.length).toBe(0);
		});

		it('has a two prefixes', () => {
			expect(trace.prefixes.length).toBe(2);
		});

		describe('.compact()', () => {
			it('does not change the trace', () => {
				trace.compact();
				expect(trace.records.length).toBe(0);
				expect(trace.prefixes.length).toBe(2);
			});
		});
	});
});
