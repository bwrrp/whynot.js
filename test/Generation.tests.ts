import Generation from '../src/Generation';

describe('Generation', () => {
	let generation: Generation;
	beforeEach(() => {
		generation = new Generation(10);
	});

	describe('.reset()', () => {
		it('empties the Generation', () => {
			generation.add(0, 5);
			generation.reset();
			expect(generation.getNextPc()).toBe(null);
			expect(generation.getBadness(0)).toBe(0);
		});
	});

	describe('.add()', () => {
		it('can add a thread with badness', () => {
			generation.add(5, 123);
			expect(generation.getBadness(5)).toBe(123);
			expect(generation.getNextPc()).toBe(5);
		});

		it('can schedule new threads when others have already been run', () => {
			generation.add(1, 5);
			generation.add(2, 4);
			expect(generation.getNextPc()).toBe(2);
			generation.add(3, 0);
			expect(generation.getNextPc()).toBe(3);
			expect(generation.getNextPc()).toBe(1);
			expect(generation.getNextPc()).toBe(null);
		});
	});

	describe('.reschedule()', () => {
		it('adjusts the badness and execution order of a thread that did not run', () => {
			generation.add(1, 1);
			generation.add(2, 2);
			generation.add(3, 3);
			generation.reschedule(2, 4);
			expect(generation.getBadness(2)).toBe(4);
			expect(generation.getNextPc()).toBe(1);
			expect(generation.getNextPc()).toBe(3);
			expect(generation.getNextPc()).toBe(2);
		});

		it('only adjusts badness up', () => {
			generation.add(1, 10);
			generation.reschedule(1, 4);
			expect(generation.getBadness(1)).toBe(10);
		});

		it('adjusts the badness but not execution order if the thread did run', () => {
			generation.add(1, 1);
			generation.add(2, 2);
			expect(generation.getNextPc()).toBe(1);
			generation.reschedule(1, 3);
			expect(generation.getBadness(1)).toBe(3);
			expect(generation.getNextPc()).toBe(2);
			expect(generation.getNextPc()).toBe(null);
		});
	});

	describe('.getNextThread()', () => {
		it('returns threads in order of increasing badness', () => {
			generation.add(1, 5);
			generation.add(2, 4);
			generation.add(3, 3);
			generation.add(4, 2);
			generation.add(5, 1);
			expect(generation.getNextPc()).toBe(5);
			expect(generation.getNextPc()).toBe(4);
			expect(generation.getNextPc()).toBe(3);
			expect(generation.getNextPc()).toBe(2);
			expect(generation.getNextPc()).toBe(1);
			expect(generation.getNextPc()).toBe(null);
		});
	});
});
