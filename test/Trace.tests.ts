import Trace from '../src/Trace';

import * as chai from 'chai';

const PROGRAM_LENGTH = 10;

describe('Trace', () => {
	describe('no preceding trace', () => {
		let trace: Trace;
		beforeEach(() => {
			trace = new Trace(4, PROGRAM_LENGTH, null, 0);
		});

		it('has a head', () => {
			chai.expect(trace.head).to.deep.equal([4]);
		});

		it('has no records', () => {
			chai.expect(trace.records.length).to.equal(0);
		});

		it('has no prefixes', () => {
			chai.expect(trace.prefixes.length).to.equal(0);
		});

		describe('.compact()', () => {
			it('does not change the trace', () => {
				trace.compact();

				chai.expect(trace.head).to.deep.equal([4]);
				chai.expect(trace.records.length).to.equal(0);
				chai.expect(trace.prefixes.length).to.equal(0);
			});
		});
	});

	describe('single preceding trace', () => {
		let rootTrace: Trace;
		let trace: Trace;
		beforeEach(() => {
			rootTrace = new Trace(1, PROGRAM_LENGTH, null, 0);
			trace = new Trace(4, PROGRAM_LENGTH, rootTrace, 1);
		});

		it('has a head', () => {
			chai.expect(trace.head).to.deep.equal([4]);
		});

		it('has no records', () => {
			chai.expect(trace.records.length).to.equal(0);
		});

		it('has a single prefix', () => {
			chai.expect(trace.prefixes.length).to.equal(1);
			chai.expect(trace.prefixes[0].head).to.deep.equal([1]);
		});

		describe('.compact()', () => {
			it('combines the traces', () => {
				trace.compact();

				chai.expect(trace.head).to.deep.equal([1, 4]);
				chai.expect(trace.records.length).to.equal(0);
				chai.expect(trace.prefixes.length).to.equal(0);
			});

			describe('with records', () => {
				beforeEach(() => {
					rootTrace.records.push('bla');
					trace.records.push('meep');
				});

				it('combines the traces', () => {
					trace.compact();

					chai.expect(trace.head).to.deep.equal([1, 4]);
					chai.expect(trace.records).to.deep.equal(['bla', 'meep']);
					chai.expect(trace.prefixes.length).to.equal(0);
				});
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

		it('has a head', () => {
			chai.expect(trace.head).to.deep.equal([4]);
		});

		it('has no records', () => {
			chai.expect(trace.records.length).to.equal(0);
		});

		it('has a two prefixes', () => {
			chai.expect(trace.prefixes.length).to.equal(2);
			chai.expect(trace.prefixes[0].head).to.deep.equal([1]);
			chai.expect(trace.prefixes[1].head).to.deep.equal([2]);
		});

		describe('.compact()', () => {
			it('does not change the trace', () => {
				trace.compact();

				chai.expect(trace.head).to.deep.equal([4]);
				chai.expect(trace.records.length).to.equal(0);
				chai.expect(trace.prefixes.length).to.equal(2);
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
			chai.expect(trace1.contains(1)).to.equal(true);
			chai.expect(trace1.contains(2)).to.equal(false);
			chai.expect(trace1.contains(3)).to.equal(true);
		});

		it('can check whether a trace visited an instruction in a specific generation', () => {
			chai.expect(trace1.contains(1, 0)).to.equal(true);
			chai.expect(trace1.contains(1, 1)).to.equal(false);
			chai.expect(trace1.contains(2, 0)).to.equal(false);
			chai.expect(trace1.contains(2, 1)).to.equal(false);
			chai.expect(trace1.contains(3, 0)).to.equal(false);
			chai.expect(trace1.contains(3, 1)).to.equal(true);
		});

		it('checks all prefixes, considering the most recent generation only', () => {
			trace1.join(trace2);
			chai.expect(trace1.contains(1, 0)).to.equal(false);
			chai.expect(trace1.contains(1, 1)).to.equal(true);
			chai.expect(trace1.contains(2, 0)).to.equal(false);
			chai.expect(trace1.contains(2, 1)).to.equal(true);
			chai.expect(trace1.contains(3, 0)).to.equal(false);
			chai.expect(trace1.contains(3, 1)).to.equal(true);
		});

		it('also updates descendant traces when a prefix is merged', () => {
			rootTrace1.join(rootTrace2);
			chai.expect(trace1.contains(1, 0)).to.equal(true);
			chai.expect(trace1.contains(1, 1)).to.equal(false);
			chai.expect(trace1.contains(2, 0)).to.equal(false);
			chai.expect(trace1.contains(2, 1)).to.equal(true);
			chai.expect(trace1.contains(3, 0)).to.equal(false);
			chai.expect(trace1.contains(3, 1)).to.equal(true);
		});
	});
});
