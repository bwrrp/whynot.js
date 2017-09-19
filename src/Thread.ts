import Trace from './Trace';

/**
 * A Thread represents scheduled execution of a specific instruction.
 */
export default class Thread {
	public pc: number;
	public trace: Trace;
	public badness: number;

	private _generationNumber: number;

	/**
	 * @param pc               Program counter for the scheduled instruction
	 * @param programLength    Length of the current program
	 * @param parentThread     The thread that spawned this thread
	 * @param badness          Increasing badness decreases thread priority
	 * @param generationNumber The index of the genaration this Thread is running in
	 */
	constructor(
		pc: number,
		programLength: number,
		parentThread: Thread | undefined,
		badness: number = 0,
		generationNumber: number
	) {
		this.pc = pc;

		const prefixTrace = parentThread ? parentThread.trace : null;
		this.trace = new Trace(pc, programLength, prefixTrace, generationNumber);

		this.badness = badness || 0;

		this._generationNumber = generationNumber;
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
}
