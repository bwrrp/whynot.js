define(
	[
		'./Assembler',
		'./VM'
	],
	function(Assembler, VM) {
		'use strict';

		return {
			Assembler: Assembler,
			VM: VM,

			compileVM: function(compile) {
				var assembler = new Assembler();
				compile(assembler);
				return new VM(assembler.program);
			}
		};
	}
);
