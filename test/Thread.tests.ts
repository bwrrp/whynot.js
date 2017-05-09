import Thread from '../src/Thread';

import * as chai from 'chai';

const PROGRAM_LENGTH = 10;

describe('Thread', () => {
	describe('no preceding thread', () => {
		let thread: Thread;
		beforeEach(() => {
			thread = new Thread(4, PROGRAM_LENGTH, undefined, 123, 0);
		});

		it('has a program counter', () => {
			chai.expect(thread.pc).to.equal(4);
		});

		it('has badness', () => {
			chai.expect(thread.badness).to.equal(123);
		});

		it('has a root trace', () => {
			chai.expect(thread.trace.prefixes.length).to.equal(0);
		});
	});

	describe('single preceding thread', () => {
		let rootThread: Thread;
		let thread: Thread;
		beforeEach(() => {
			rootThread = new Thread(1, PROGRAM_LENGTH, undefined, 123, 0);
			thread = new Thread(4, PROGRAM_LENGTH, rootThread, 456, 1);
		});

		it('has a program counter', () => {
			chai.expect(thread.pc).to.equal(4);
		});

		it('has badness', () => {
			chai.expect(thread.badness).to.equal(456);
		});

		it('has a prefixed trace', () => {
			chai.expect(thread.trace.prefixes.length).to.equal(1);
		});
	});

	describe('.join()', () => {
		let rootThread: Thread;
		let otherRootThread: Thread;
		let thread: Thread;
		beforeEach(() => {
			rootThread = new Thread(1, PROGRAM_LENGTH, undefined, 123, 0);
			otherRootThread = new Thread(2, PROGRAM_LENGTH, undefined, 234, 0);
			thread = new Thread(4, PROGRAM_LENGTH, rootThread, 456, 1);

			thread.join(otherRootThread, 789);
		});

		it('has a program counter', () => {
			chai.expect(thread.pc).to.equal(4);
		});

		it('has maximum badness', () => {
			chai.expect(thread.badness).to.equal(789);
		});

		it('has a double-prefixed trace', () => {
			chai.expect(thread.trace.prefixes.length).to.equal(2);
		});
	});
});
