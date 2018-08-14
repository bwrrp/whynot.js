import Thread from './Thread';
import DisjointSet from './DisjointSet';

function createThread(
	oldThreads: Thread[],
	pc: number,
	parentThread: Thread | undefined,
	generationNumber: number,
	threadId: number,
	badness: number
): Thread {
	if (!oldThreads.length) {
		return new Thread(pc, parentThread, generationNumber, threadId, badness);
	}

	// Recycle existing thread
	const thread = oldThreads.pop() as Thread;
	thread.initialize(pc, parentThread, generationNumber, threadId, badness);
	return thread;
}

function findInsertionIndex(threadList: Thread[], nextThreadIndex: number, badness: number) {
	// Perform a binary search to find the index of the first thread with lower badness
	let low = nextThreadIndex;
	let high = threadList.length;
	while (low < high) {
		// Use zero-filling shift as integer division
		const mid = (low + high) >>> 1;
		// Compare to mid point, preferring right in case of equality
		if (badness < threadList[mid].badness) {
			// Thread goes in lower half
			high = mid;
		} else {
			// Thread goes in upper half
			low = mid + 1;
		}
	}

	return low;
}

/**
 * Represents the threads scheduled to operate on a single input item
 */
export default class Generation {
	private _threadList: Thread[] = [];
	private _oldThreads: Thread[];
	private _nextThread: number = 0;
	private _programLength: number;
	private _threadsByProgramCounter: (Thread | null)[];
	private _generationNumber: number;
	private _ancestries: DisjointSet

	/**
	 * @param programLength    The length of the program being run
	 * @param oldThreadList    Array used for recycling Thread objects
	 * @param generationNumber The index of generation
	 */
	constructor(programLength: number, oldThreadList: Thread[], generationNumber: number) {
		this._oldThreads = oldThreadList;
		this._programLength = programLength;
		this._threadsByProgramCounter = new Array(programLength);
		this._generationNumber = generationNumber;
		this._ancestries = new DisjointSet(programLength);
	}

	/**
	 * Resets the Generation for reuse.
	 *
	 * @param generationNumber The new index of this generation. Used to test if certain Traces have
	 *                         processed a given PC before.
	 */
	reset(generationNumber: number) {
		// Compact and recycle threads
		let i, l;
		for (i = 0, l = this._threadList.length; i < l; ++i) {
			const thread = this._threadList[i];
			thread.compact();
			this._oldThreads.push(thread);
		}
		this._threadList.length = 0;
		// Reset thread counter
		this._nextThread = 0;

		this._generationNumber = generationNumber;
		this._threadsByProgramCounter.fill(null);
		this._ancestries.makeSet();
	}

	/**
	 * Adds a Thread to the Generation.
	 *
	 * Only a single thread can be added for each instruction, subsequent threads are joined with
	 * the previous threads. All traces are preserved, but only a single thread continues execution.
	 * This works, because instructions never depend on a thread's history.
	 *
	 * @param pc           Program counter for the new Thread
	 * @param parentThread Thread which spawned the new Thread
	 * @param badness      Increasing badness decreases thread priority
	 *
	 * @return The Thread that was added, or null if no thread was added
	 */
	addThread(pc: number, parentThread?: Thread, badness: number = 0): Thread | null {
		// Only add threads for in-program locations
		if (pc >= this._programLength) {
			return null;
		}

		// If a thread for pc already exists in this generation, combine traces and return
		const existingThreadForProgramCounter = this._threadsByProgramCounter[pc];
		if (existingThreadForProgramCounter) {
			if (parentThread === null || parentThread === undefined) {
				existingThreadForProgramCounter.updateBadness(badness);
				return null;
			}

			if (parentThread.generationNumber !== this._generationNumber) {
				existingThreadForProgramCounter.updateBadness(badness);
				existingThreadForProgramCounter.trace.join(parentThread.trace);
				return null;
			}

			const parentThreadRep = this._ancestries.find(parentThread.threadId);
			if (parentThreadRep === existingThreadForProgramCounter.threadId) {
				return null;
			}

			existingThreadForProgramCounter.updateBadness(badness);
			existingThreadForProgramCounter.trace.join(parentThread.trace);
			this._ancestries.union(parentThread.threadId, existingThreadForProgramCounter.threadId);

			return null;
		}

		const threadId = this._threadList.length;
		const thread = createThread(
			this._oldThreads,
			pc,
			parentThread,
			this._generationNumber,
			threadId,
			badness
		);
		if (parentThread != null && parentThread.generationNumber === this._generationNumber) {
			this._ancestries.union(parentThread.threadId, threadId);
		}

		// Schedule thread according to badness
		const index = findInsertionIndex(this._threadList, this._nextThread, badness);
		this._threadList.splice(index, 0, thread);

		this._threadsByProgramCounter[pc] = thread;

		return thread;
	}

	/**
	 * Returns the next Thread to run for this generation.
	 *
	 * @return The Thread to run, or null if there are no threads left.
	 */
	getNextThread(): Thread | null {
		if (this._nextThread >= this._threadList.length) {
			return null;
		}
		return this._threadList[this._nextThread++];
	}
}
