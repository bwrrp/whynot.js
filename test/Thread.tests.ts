import Thread from '../src/Thread';

const expectedThreadId = 456;

describe('Thread', () => {
	describe('no preceding thread', () => {
		let thread: Thread;
		beforeEach(() => {
			thread = new Thread(4, undefined, 0, expectedThreadId, 123);
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
			rootThread = new Thread(1, undefined, 0, expectedThreadId, 123);
			thread = new Thread(4, rootThread, 1, expectedThreadId, 456);
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
			rootThread = new Thread(1, undefined, 0, expectedThreadId, 123);
			otherRootThread = new Thread(2, undefined, 0, expectedThreadId, 234);
			thread = new Thread(4, rootThread, 1, expectedThreadId, 456);

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

	describe('defaults', () => {
		let rootThread: Thread;
		let otherRootThread: Thread;
		let thread: Thread;

		it('default badness', () => {
			rootThread = new Thread(1, undefined, 0, expectedThreadId);
			otherRootThread = new Thread(2, undefined, 0, expectedThreadId);
			thread = new Thread(4, rootThread, 1, expectedThreadId);

			thread.join(otherRootThread);
			expect(thread.badness).toBe(0);
		});

		it('default join', () => {
			thread = new Thread(4, rootThread, 1, expectedThreadId);
			thread.join();
			expect(thread.badness).toBe(0);
		});

		it('reinitialize thread with default badness', () => {
			thread = new Thread(4, rootThread, 1, expectedThreadId);
			thread.initialize(4, rootThread, 1, expectedThreadId);
			expect(thread.badness).toBe(0);
		}) 
	})
});
