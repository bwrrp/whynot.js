import Assembler from './Assembler';
import VM from './VM';

export { default as Assembler } from './Assembler';
export { default as VM } from './VM';

/**
 * Convenience helper function that creates a new VM using the specified callback for compilation.
 *
 * @public
 *
 * @param compile - Function used to compile the program, invoked with an Assembler as the only
 *                  parameter.
 *
 * @returns VM running the compiled program
 */
export function compileVM<TInput, TRecord = void, TOptions = void>(
	compile: (assembler: Assembler<TInput, TRecord, TOptions>) => void
): VM<TInput, TRecord, TOptions> {
	const assembler = new Assembler<TInput, TRecord, TOptions>();
	compile(assembler);
	return new VM<TInput, TRecord, TOptions>(assembler.program);
}

export default { Assembler, VM, compileVM };
