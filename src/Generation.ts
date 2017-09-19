import Thread from './Thread';

function createThread(
	oldThreads: Thread[],
	pc: number,
	programLength: number,
	parentThread: Thread | undefined,
	badness: number,
	generationNumber: number
): Thread {
	if (!oldThreads.length) {
		return new Thread(pc, programLength, parentThread, badness, generationNumber);
	}

	// Recycle existing thread
	const thread = oldThreads.pop() as Thread;
	thread.initialize(pc, programLength, parentThread, badness, generationNumber);
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
		// Reset threads by program counter lookup
		for (i = 0, l = this._programLength; i < l; ++i) {
			this._threadsByProgramCounter[i] = null;
		}

		this._generationNumber = generationNumber;
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
			// Detect repetition in the same generation, which would cause cyclic traces
			if (!parentThread || !parentThread.trace.contains(pc, this._generationNumber)) {
				// Non-cyclic trace, join threads
				existingThreadForProgramCounter.join(parentThread, badness);
			}

			return null;
		}

		const thread = createThread(
			this._oldThreads,
			pc,
			this._programLength,
			parentThread,
			badness,
			this._generationNumber
		);

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
