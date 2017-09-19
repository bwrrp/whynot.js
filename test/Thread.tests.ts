import Thread from '../src/Thread';

const PROGRAM_LENGTH = 10;

describe('Thread', () => {
	describe('no preceding thread', () => {
		let thread: Thread;
		beforeEach(() => {
			thread = new Thread(4, PROGRAM_LENGTH, undefined, 123, 0);
		});

		it('has a program counter', () => {
			expect(thread.pc).toBe(4);
		});

		it('has badness', () => {
			expect(thread.badness).toBe(123);
		});

		it('has a root trace', () => {
			expect(thread.trace.prefixes.length).toBe(0);
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
			expect(thread.pc).toBe(4);
		});

		it('has badness', () => {
			expect(thread.badness).toBe(456);
		});

		it('has a prefixed trace', () => {
			expect(thread.trace.prefixes.length).toBe(1);
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
			expect(thread.pc).toBe(4);
		});

		it('has maximum badness', () => {
			expect(thread.badness).toBe(789);
		});

		it('has a double-prefixed trace', () => {
			expect(thread.trace.prefixes.length).toBe(2);
		});
	});
});
