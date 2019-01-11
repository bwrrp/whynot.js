import { Instruction, Operation } from './Instruction';

export default class ProgramInfo {
	private constructor(
		public programLength: number,
		public maxFromByPc: number[],
		public maxSurvivorFromByPc: number[]
	) {}

	public static fromProgram<TInput, TRecord, TOptions>(
		program: Instruction<TInput, TRecord, TOptions>[]
	): ProgramInfo {
		const programLength = program.length;

		// Determine maximum number of incoming paths per instructon
		const maxFromByPc: number[] = [];
		const maxSurvivorFromByPc: number[] = [];
		program.forEach(_ => {
			maxFromByPc.push(0);
			maxSurvivorFromByPc.push(0);
		});
		program.forEach((instruction, pc) => {
			switch (instruction.op) {
				case Operation.FAIL:
					if (instruction.func === null) {
						// Unconditional fail, threads will never continue past this instruction
						return;
					}
					if (pc + 1 >= programLength) {
						throw new Error('Invalid program: program could run past end');
					}
					maxFromByPc[pc + 1] += 1;
					break;

				case Operation.BAD:
				case Operation.RECORD:
					if (pc + 1 >= programLength) {
						throw new Error('Invalid program: program could run past end');
					}
					maxFromByPc[pc + 1] += 1;
					break;

				case Operation.JUMP:
					const targets = instruction.data as number[];
					targets.forEach(targetPc => {
						if (targetPc < 0 || targetPc >= programLength) {
							throw new Error('Invalid program: program could run past end');
						}
						maxFromByPc[targetPc] += 1;
					});
					break;

				case Operation.TEST:
					if (pc + 1 >= programLength) {
						throw new Error('Invalid program: program could run past end');
					}
					maxSurvivorFromByPc[pc + 1] += 1;
					break;

				case Operation.ACCEPT:
					maxSurvivorFromByPc[pc] += 1;
					break;
			}
		});

		return new ProgramInfo(programLength, maxFromByPc, maxSurvivorFromByPc);
	}

	/**
	 * Creates a stub ProgramInfo with incoming info maxed out to ensure enough space is allocated
	 * in FromBuffers for simulating any program.
	 *
	 * For testing only.
	 *
	 * @param programLength The length of the supposed program
	 */
	public static createStub(programLength: number): ProgramInfo {
		const maxFromByPc: number[] = [];
		const maxSurvivorFromByPc: number[] = [];
		for (let i = 0; i < programLength; ++i) {
			maxFromByPc.push(programLength);
			maxSurvivorFromByPc.push(programLength);
		}

		return new ProgramInfo(programLength, maxFromByPc, maxSurvivorFromByPc);
	}
}
