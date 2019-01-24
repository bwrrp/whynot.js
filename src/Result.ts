import Trace from './Trace';

/**
 * The result of running a VM on an input sequence.
 *
 * @public
 */
export default class Result<TRecord> {
	/**
	 * Whether the input was accepted by the program.
	 */
	public readonly success: boolean;

	constructor(
		/**
		 * The traces that lead to input being accepted, or an empty array if the input was not
		 * accepted by the program.
		 */
		public readonly acceptingTraces: Trace<TRecord>[]
	) {
		this.success = acceptingTraces.length > 0;
	}
}
