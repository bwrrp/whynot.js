import Assembler from '../src/Assembler';
import ProgramInfo from '../src/ProgramInfo';

describe('ProgramInfo', () => {
	let assembler: Assembler<void, string>;
	beforeEach(() => {
		assembler = new Assembler();
	});

	it('throws when given a program that may run past its end (bad)', () => {
		assembler.bad();
		expect(() => {
			ProgramInfo.fromProgram(assembler.program);
		}).toThrow('Invalid program: program could run past end');
	});

	it('throws when given a program that may run past its end (fail)', () => {
		assembler.fail(() => false);
		expect(() => {
			ProgramInfo.fromProgram(assembler.program);
		}).toThrow('Invalid program: program could run past end');
	});

	it('throws when given a program that may run past its end (record)', () => {
		assembler.record('R');
		expect(() => {
			ProgramInfo.fromProgram(assembler.program);
		}).toThrow('Invalid program: program could run past end');
	});

	it('throws when given a program that may run past its end (jump)', () => {
		assembler.jump([100]);
		expect(() => {
			ProgramInfo.fromProgram(assembler.program);
		}).toThrow('Invalid program: program could run past end');
	});

	it('throws when given a program that may run past its end (test)', () => {
		assembler.test(() => true);
		expect(() => {
			ProgramInfo.fromProgram(assembler.program);
		}).toThrow('Invalid program: program could run past end');
	});
});
