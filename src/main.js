define(
	[
		'./assembler',
		'./vm'
	],
	function(Assembler, VM) {
		'use strict';

		return {
			Assembler: Assembler,
			VM: VM
		};
	}
);
