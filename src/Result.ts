import Trace from './Trace';

/**
 * The result of running a VM on an input sequence.
 */
export default class Result<TRecord> {
	public success: boolean;

	constructor(public acceptingTraces: Trace<TRecord>[]) {
		this.success = acceptingTraces.length > 0;
	}
}
