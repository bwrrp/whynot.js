import Trace from './Trace';

/**
 * A Thread represents scheduled execution of a specific instruction.
 */
export default class Thread {
	public pc!: number;
	public trace!: Trace;
	public badness!: number;
	public threadId!: number;

	private _generationNumber!: number;

	/**
	 * @param pc               Program counter for the scheduled instruction
	 * @param parentThread     The thread that spawned this thread
	 * @param generationNumber The index of the genaration this Thread is running in
	 * @param threadId         Id of a thread
	 * @param badness          Increasing badness decreases thread priority
	 */
	constructor(
		pc: number,
		parentThread: Thread | undefined,
		generationNumber: number,
		threadId: number,
		badness: number = 0
	) {
		this.initialize(pc, parentThread, generationNumber, threadId, badness);
	}

	/**
	 * (re)initialize the Thread object with the specified values
	 *
	 * @param pc               Program counter for the scheduled instruction
	 * @param parentThread     The thread that spawned this thread
	 * @param generationNumber The index of the genaration this Thread is running in
	 * @param threadId         Id of a thread
	 * @param badness          Increasing badness decreases thread priority
	 */
	initialize(
		pc: number,
		parentThread: Thread | undefined,
		generationNumber: number,
		threadId: number,
		badness: number = 0
	) {
		this.pc = pc;

		const prefixTrace = parentThread ? parentThread.trace : null;
		this.trace = new Trace(prefixTrace);

		this.badness = badness || 0;

		this._generationNumber = generationNumber;
		this.threadId = threadId;
	}

	// Getter for generationNumber property.
    get generationNumber(): number {
        return this._generationNumber;
    }

	/**
	 * Another thread joins the current, combine traces and badness.
	 *
	 * @param otherParentThread Parent thread of the other thread
	 * @param badness           Badness of the other thread
	 */
	join(otherParentThread?: Thread, badness: number = 0) {
		if (otherParentThread) {
			this.trace.join(otherParentThread.trace);
		}
		this.badness = Math.max(this.badness, badness);
	}

	/**
	 * Compacts the Thread's footprint when its Generation ends.
	 */
	compact() {
		this.trace.compact();
	}

	/**
	 * Update the badness.
	 * 
	 * @param badness Number of badness
	 */
	updateBadness(badness: number) {
		this.badness = Math.max(this.badness, badness);
	}
}
