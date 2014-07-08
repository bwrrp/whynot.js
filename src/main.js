/**
 * Generic VM-based formal language matching framework.
 * This module provides an API object which exposes the usual entry points for this library.
 *
 * @module whynot
 */
define(
	[
		'./Assembler',
		'./VM'
	],
	function(Assembler, VM) {
		'use strict';

		/**
		 * The API for the library.
		 *
		 * @class API
		 * @static
		 */
		return {
			/**
			 * The Assembler constructor
			 *
			 * @property Assembler
			 * @type {Function}
			 * @final
			 */
			Assembler: Assembler,

			/**
			 * The VM constructor
			 *
			 * @property VM
			 * @type {Function}
			 * @final
			 */
			VM: VM,

			/**
			 * Helper function that creates a new VM using the specified callback for compilation
			 *
			 * @method compileVM
			 *
			 * @param {Function} compile         Function used to compile the program, invoked
			 *                                     with an Assembler as the only parameter.
			 * @param {Thread[]} [oldThreadList] Array used for recycling Thread objects. An
			 *                                     existing array can be passed in to share
			 *                                     recycled threads between VMs.
			 *
			 * @return {VM} VM running the compiled program
			 */
			compileVM: function(compile, oldThreadList) {
				var assembler = new Assembler();
				compile(assembler);
				return new VM(assembler.program, oldThreadList);
			}
		};
	}
);
