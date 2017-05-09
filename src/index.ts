import Assembler from './Assembler';
import Thread from './Thread';
import VM from './VM';

export { default as Assembler } from './Assembler';
export { default as VM } from './VM';

/**
 * Helper function that creates a new VM using the specified callback for compilation
 *
 * @param {Function} compile         Function used to compile the program, invoked
 *                                     with an Assembler as the only parameter.
 * @param {Thread[]} [oldThreadList] Array used for recycling Thread objects. An
 *                                     existing array can be passed in to share
 *                                     recycled threads between VMs.
 *
 * @return {VM} VM running the compiled program
 */
export function compileVM (compile: (assembler: Assembler) => void, oldThreadList?: Thread[]): VM {
	const assembler = new Assembler();
	compile(assembler);
	return new VM(assembler.program, oldThreadList);
}

export default { Assembler, VM, compileVM };
