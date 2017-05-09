import Generation from './Generation';
import Thread from './Thread';

/**
 * Schedules Threads to run in the current or a future Generation.
 */
export default class Scheduler {
	private _generations: Generation[] = [];
	private _generationsCompleted: number;

    /**
	 * @param numGenerations Number of Generations to plan ahead
	 * @param programLength  Length of the program being run
	 * @param oldThreadList  Array used for recycling Thread objects
	 */
	constructor (numGenerations: number, programLength: number, oldThreadList: Thread[]) {
		// The active and scheduled generations
		this._generations = [];
		for (let i = 0; i < numGenerations; ++i) {
			this._generations.push(new Generation(programLength, oldThreadList, i));
		}
		// The number of generations executed so far
		this._generationsCompleted = 0;
	}

	/**
	 * Resets the Scheduler for reuse.
	 */
	reset () {
		// Reset each generation
		for (let i = 0, l = this._generations.length; i < l; ++i) {
			this._generations[i].reset(i);
		}
		this._generationsCompleted = 0;
	}

	private _getRelativeGeneration (generationOffset: number) {
		// Determine generation to insert the new thread for
		const numGenerations = this._generations.length;
		if (generationOffset >= numGenerations) {
			throw new Error('Not enough active generations to schedule that far ahead');
		}
		const generationNumber = this._generationsCompleted + generationOffset;
		return this._generations[generationNumber % numGenerations];
	}

	/**
	 * Adds a Thread to the Generation at the given offset relative to the current one.
	 *
	 * @param generationOffset Offset of the target generation, relative to the current
	 * @param pc               Program counter for the new Thread
	 * @param parentThread     Thread which spawned the new Thread
	 * @param badness          Increasing badness decreases thread priority
	 *
	 * @return The Thread that was added, or null if no thread was added
	 */
	addThread (generationOffset: number, pc: number, parentThread?: Thread, badness?: number): Thread | null {
		const generationForThread = this._getRelativeGeneration(generationOffset);

		// Add thread to the generation
		return generationForThread.addThread(pc, parentThread, badness);
	}

	/**
	 * Returns the next thread to run in the current Generation.
	 *
	 * @return The next Thread to run, or null if there are none left
	 */
	getNextThread (): Thread | null {
		const currentGeneration = this._getRelativeGeneration(0);
		return currentGeneration.getNextThread();
	}

	/**
	 * Switches to the next Generation.
	 */
	nextGeneration () {
		// Recycle current generation and move to next
		const currentGeneration = this._getRelativeGeneration(0);
		currentGeneration.reset(this._generationsCompleted + this._generations.length);
		++this._generationsCompleted;
	}
}
