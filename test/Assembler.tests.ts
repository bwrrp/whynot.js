import Assembler from '../src/Assembler';
import { RecordFunc, Operation } from '../src/Instruction';

describe('Assembler', () => {
	let assembler: Assembler<void, object | string>;
	beforeEach(() => {
		assembler = new Assembler();
	});

	function truth() {
		return true;
	}

	describe('.test()', () => {
		it('generates a test instruction', () => {
			const instruction = assembler.test(truth);
			expect(instruction.op).toBe(Operation.TEST);
			expect(instruction.func).toBe(truth);
		});

		it('generates a test instruction with data', () => {
			const instruction = assembler.test(truth, 'meep');
			expect(instruction.op).toBe(Operation.TEST);
			expect(instruction.func).toBe(truth);
			expect(instruction.data).toBe('meep');
		});

		it('appends the instruction to the program', () => {
			const instruction = assembler.test(truth);
			expect(assembler.program[assembler.program.length - 1]).toBe(instruction);
		});
	});

	describe('.jump()', () => {
		it('generates a jump instruction', () => {
			const instruction = assembler.jump([1, 2, 3]);
			expect(instruction.op).toBe(Operation.JUMP);
			expect(instruction.data).toEqual([1, 2, 3]);
		});

		it('appends the instruction to the program', () => {
			const instruction = assembler.jump([]);
			expect(assembler.program[assembler.program.length - 1]).toBe(instruction);
		});
	});

	describe('.record()', () => {
		const data = {};

		describe('without recorder', () => {
			it('generates a record instruction', () => {
				const instruction = assembler.record(data);
				expect(instruction.op).toBe(Operation.RECORD);
				expect((instruction.func as RecordFunc<object>)(instruction.data, 0)).toBe(data);
			});

			it('appends the instruction to the program', () => {
				const instruction = assembler.record(data);
				expect(assembler.program[assembler.program.length - 1]).toBe(instruction);
			});
		});
		describe('with recorder', () => {
			function recorder(_data: object, _index: number) {
				return 'meep';
			}

			it('generates a record instruction', () => {
				const instruction = assembler.record(data, recorder);
				expect(instruction.op).toBe(Operation.RECORD);
				expect((instruction.func as RecordFunc<any>)(instruction.data, 0)).toBe('meep');
			});

			it('appends the instruction to the program', () => {
				const instruction = assembler.record(data, recorder);
				expect(assembler.program[assembler.program.length - 1]).toBe(instruction);
			});
		});
	});

	describe('.bad()', () => {
		it('generates a bad instruction', () => {
			const instruction = assembler.bad();
			expect(instruction.op).toBe(Operation.BAD);
		});

		it('appends the instruction to the program', () => {
			const instruction = assembler.bad();
			expect(assembler.program[assembler.program.length - 1]).toBe(instruction);
		});
	});

	describe('.accept()', () => {
		it('generates an accept instruction', () => {
			const instruction = assembler.accept();
			expect(instruction.op).toBe(Operation.ACCEPT);
		});

		it('appends the instruction to the program', () => {
			const instruction = assembler.accept();
			expect(assembler.program[assembler.program.length - 1]).toBe(instruction);
		});
	});

	describe('.fail()', () => {
		describe('unconditional', () => {
			it('generates a fail instruction', () => {
				const instruction = assembler.fail();
				expect(instruction.op).toBe(Operation.FAIL);
				expect(instruction.func).toBe(null);
			});

			it('appends the instruction to the program', () => {
				const instruction = assembler.fail();
				expect(assembler.program[assembler.program.length - 1]).toBe(instruction);
			});
		});
		describe('conditional', () => {
			function conditional() {
				return false;
			}

			it('generates a fail instruction', () => {
				const instruction = assembler.fail(conditional);
				expect(instruction.op).toBe(Operation.FAIL);
				expect(instruction.func).toBe(conditional);
			});

			it('appends the instruction to the program', () => {
				const instruction = assembler.fail(conditional);
				expect(assembler.program[assembler.program.length - 1]).toBe(instruction);
			});
		});
	});
});
