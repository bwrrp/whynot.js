import Trace from '../src/Trace';

const PROGRAM_LENGTH = 10;

describe('Trace', () => {
	describe('no preceding trace', () => {
		let trace: Trace;
		beforeEach(() => {
			trace = new Trace(4, PROGRAM_LENGTH, null, 0);
		});

		it('has no records', () => {
			expect(trace.records).toBe(null);
		});

		it('has no prefixes', () => {
			expect(trace.prefixes.length).toBe(0);
		});

		describe('.compact()', () => {
			it('does not change the trace', () => {
				trace.compact();

				expect(trace.records).toBe(null);
				expect(trace.prefixes.length).toBe(0);
			});
		});
	});

	describe('single preceding trace', () => {
		let rootTrace: Trace;
		let trace: Trace;
		beforeEach(() => {
			rootTrace = new Trace(1, PROGRAM_LENGTH, null, 0);
			rootTrace.records = ['A'];
			trace = new Trace(4, PROGRAM_LENGTH, rootTrace, 1);
			trace.records = ['B'];
		});

		it('has only its own record', () => {
			expect(trace.records!.length).toBe(1);
		});

		it('has a single prefix', () => {
			expect(trace.prefixes.length).toBe(1);
		});

		describe('.compact()', () => {
			it('combines the traces', () => {
				trace.compact();

				expect(trace.records).toEqual(['A', 'B']);
				expect(trace.prefixes.length).toBe(0);
			});
		});
	});

	describe('multiple preceding traces', () => {
		let rootTrace: Trace;
		let otherRootTrace: Trace;
		let trace: Trace;
		beforeEach(() => {
			rootTrace = new Trace(1, PROGRAM_LENGTH, null, 0);
			otherRootTrace = new Trace(2, PROGRAM_LENGTH, null, 0);
			trace = new Trace(4, PROGRAM_LENGTH, rootTrace, 1);

			trace.prefixes.push(otherRootTrace);
		});

		it('has no records', () => {
			expect(trace.records).toBe(null);
		});

		it('has a two prefixes', () => {
			expect(trace.prefixes.length).toBe(2);
		});

		describe('.compact()', () => {
			it('does not change the trace', () => {
				trace.compact();
				expect(trace.records).toBe(null);
				expect(trace.prefixes.length).toBe(2);
			});
		});
	});

	describe('Compacting multiple chained traces', () => {
		let rootTrace: Trace;
		let parentTrace: Trace;
		let trace: Trace;
		beforeEach(() => {
			rootTrace = new Trace(1, PROGRAM_LENGTH, null, 0);
			rootTrace.records = ['A'];
			parentTrace = new Trace(2, PROGRAM_LENGTH, rootTrace, 1);
			parentTrace.records = ['B'];
			trace = new Trace(4, PROGRAM_LENGTH, parentTrace, 1);
		});

		describe('.compact()', () => {
			it('correctly combines the traces', () => {
				trace.compact();
				parentTrace.compact();

				expect(trace.records).toEqual(['A', 'B']);
				expect(trace.prefixes.length).toBe(0);

				expect(parentTrace.records).toEqual(['A', 'B']);
				expect(parentTrace.prefixes.length).toBe(0);
			});
		});
	});

	describe('querying', () => {
		let rootTrace1: Trace;
		let rootTrace2: Trace;
		let trace1: Trace;
		let trace2: Trace;
		beforeEach(() => {
			rootTrace1 = new Trace(1, PROGRAM_LENGTH, null, 0);
			rootTrace2 = new Trace(2, PROGRAM_LENGTH, null, 1);
			trace1 = new Trace(3, PROGRAM_LENGTH, rootTrace1, 1);
			trace2 = new Trace(1, PROGRAM_LENGTH, rootTrace2, 1);
		});

		it('can check whether a trace visited an instruction in any generation', () => {
			expect(trace1.contains(1)).toBe(true);
			expect(trace1.contains(2)).toBe(false);
			expect(trace1.contains(3)).toBe(true);
		});

		it('can check whether a trace visited an instruction in a specific generation', () => {
			expect(trace1.contains(1, 0)).toBe(true);
			expect(trace1.contains(1, 1)).toBe(false);
			expect(trace1.contains(2, 0)).toBe(false);
			expect(trace1.contains(2, 1)).toBe(false);
			expect(trace1.contains(3, 0)).toBe(false);
			expect(trace1.contains(3, 1)).toBe(true);
		});

		it('checks all prefixes, considering the most recent generation only', () => {
			trace1.join(trace2);
			expect(trace1.contains(1, 0)).toBe(false);
			expect(trace1.contains(1, 1)).toBe(true);
			expect(trace1.contains(2, 0)).toBe(false);
			expect(trace1.contains(2, 1)).toBe(true);
			expect(trace1.contains(3, 0)).toBe(false);
			expect(trace1.contains(3, 1)).toBe(true);
		});

		it('also updates descendant traces when a prefix is merged', () => {
			rootTrace1.join(rootTrace2);
			expect(trace1.contains(1, 0)).toBe(true);
			expect(trace1.contains(1, 1)).toBe(false);
			expect(trace1.contains(2, 0)).toBe(false);
			expect(trace1.contains(2, 1)).toBe(true);
			expect(trace1.contains(3, 0)).toBe(false);
			expect(trace1.contains(3, 1)).toBe(true);
		});
	});
});
