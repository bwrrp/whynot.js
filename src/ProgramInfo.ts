import { Instruction } from './Instruction';

export default class ProgramInfo {
	private constructor(
		public programLength: number,
		public maxFromByPc: number[],
		public maxSurvivorFromByPc: number[]
	) {}

	public static fromProgram<TInput, TOptions>(
		program: Instruction<TInput, TOptions>[]
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
				case 'fail':
					if (instruction.func === null) {
						// Unconditional fail, threads will never continue past this instruction
						return;
					}
					if (pc + 1 >= programLength) {
						throw new Error('Invalid program: program could run past end');
					}
					maxFromByPc[pc + 1] += 1;
					break;

				case 'bad':
				case 'record':
					if (pc + 1 >= programLength) {
						throw new Error('Invalid program: program could run past end');
					}
					maxFromByPc[pc + 1] += 1;
					break;

				case 'jump':
					const targets = instruction.data as number[];
					targets.forEach(targetPc => {
						if (targetPc < 0 || targetPc >= programLength) {
							throw new Error('Invalid program: program could run past end');
						}
						maxFromByPc[targetPc] += 1;
					});
					break;

				case 'test':
					if (pc + 1 >= programLength) {
						throw new Error('Invalid program: program could run past end');
					}
					maxSurvivorFromByPc[pc + 1] += 1;
					break;

				case 'accept':
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
