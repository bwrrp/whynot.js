define(
	function() {
		'use strict';

		function Result(acceptingTraces, failingTraces) {
			this.acceptingTraces = acceptingTraces;
			this.failingTraces = failingTraces;

			this.success = !!acceptingTraces.length;
		}

		return Result;
	}
);
