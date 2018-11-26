import Assembler from './Assembler';
import VM from './VM';

export { default as Assembler } from './Assembler';
export { default as VM } from './VM';

/**
 * Convenience helper function that creates a new VM using the specified callback for compilation.
 *
 * @param compile       Function used to compile the program, invoked with an Assembler as the only
 *                      parameter.
 *
 * @return VM running the compiled program
 */
export function compileVM<TInput, TOptions = void>(
	compile: (assembler: Assembler<TInput, TOptions>) => void
): VM<TInput, TOptions> {
	const assembler = new Assembler<TInput, TOptions>();
	compile(assembler);
	return new VM<TInput, TOptions>(assembler.program);
}

export default { Assembler, VM, compileVM };
