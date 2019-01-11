import Trace from './Trace';

/**
 * The result of running a VM on an input sequence.
 */
export default class Result<TRecord> {
	public readonly success: boolean;

	constructor(public readonly acceptingTraces: Trace<TRecord>[]) {
		this.success = acceptingTraces.length > 0;
	}
}
