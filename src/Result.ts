import Trace from './Trace';

/**
 * The result of running a VM on an input sequence.
 */
export default class Result {
    public success: boolean;

	constructor (public acceptingTraces: Trace[], public failingTraces: Trace[]) {
		this.success = !!acceptingTraces.length;
	}
}
