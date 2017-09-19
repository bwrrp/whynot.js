import Assembler from './Assembler';
import Thread from './Thread';
import VM from './VM';

export { default as Assembler } from './Assembler';
export { default as VM } from './VM';

/**
 * Convenience helper function that creates a new VM using the specified callback for compilation.
 *
 * @param compile       Function used to compile the program, invoked with an Assembler as the only
 *                      parameter.
 * @param oldThreadList Array used for recycling Thread objects. An existing array can be passed in
 *                      to share recycled threads between VMs.
 *
 * @return VM running the compiled program
 */
export function compileVM<I, O = void>(
	compile: (assembler: Assembler<I, O>) => void,
	oldThreadList?: Thread[]
): VM<I, O> {
	const assembler = new Assembler<I, O>();
	compile(assembler);
	return new VM<I, O>(assembler.program, oldThreadList);
}

export default { Assembler, VM, compileVM };
