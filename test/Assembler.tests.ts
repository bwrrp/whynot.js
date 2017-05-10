import Assembler from '../src/Assembler';
import { RecordFunc } from "../src/Instruction";

import * as chai from 'chai';

describe('Assembler', () => {
	let assembler: Assembler<void>;
	beforeEach(() => {
		assembler = new Assembler<void>();
	});

	function truth () {
		return true;
	}

	describe('.test()', () => {
		it('generates a test instruction', () => {
			const instruction = assembler.test(truth);
			chai.expect(instruction.op).to.equal('test');
			chai.expect(instruction.func).to.equal(truth);
		});

		it('generates a test instruction with data', () => {
			const instruction = assembler.test(truth, 'meep');
			chai.expect(instruction.op).to.equal('test');
			chai.expect(instruction.func).to.equal(truth);
			chai.expect(instruction.data).to.equal('meep');
		});

		it('appends the instruction to the program', () => {
			const instruction = assembler.test(truth);
			chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
		});
	});

	describe('.jump()', () => {
		it('generates a jump instruction', () => {
			const instruction = assembler.jump([1, 2, 3]);
			chai.expect(instruction.op).to.equal('jump');
			chai.expect(instruction.data).to.deep.equal([1, 2, 3]);
		});

		it('appends the instruction to the program', () => {
			const instruction = assembler.jump([]);
			chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
		});
	});

	describe('.record()', () => {
		const data = {};

		describe('without recorder', () => {
			it('generates a record instruction', () => {
				const instruction = assembler.record(data);
				chai.expect(instruction.op).to.equal('record');
				chai.expect((instruction.func as RecordFunc)(instruction.data, 0)).to.equal(data);
			});

			it('appends the instruction to the program', () => {
				const instruction = assembler.record(data);
				chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
			});
		});
		describe('with recorder', () => {
			function recorder (_data: any, _index: number) {
				return 'meep';
			}

			it('generates a record instruction', () => {
				const instruction = assembler.record(data, recorder);
				chai.expect(instruction.op).to.equal('record');
				chai.expect((instruction.func as RecordFunc)(instruction.data, 0)).to.equal('meep');
			});

			it('appends the instruction to the program', () => {
				const instruction = assembler.record(data, recorder);
				chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
			});
		});
	});

	describe('.bad()', () => {
		it('generates a bad instruction', () => {
			const instruction = assembler.bad();
			chai.expect(instruction.op).to.equal('bad');
		});

		it('appends the instruction to the program', () => {
			const instruction = assembler.bad();
			chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
		});
	});

	describe('.accept()', () => {
		it('generates an accept instruction', () => {
			const instruction = assembler.accept();
			chai.expect(instruction.op).to.equal('accept');
		});

		it('appends the instruction to the program', () => {
			const instruction = assembler.accept();
			chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
		});
	});

	describe('.fail()', () => {
		describe('unconditional', () => {
			it('generates a fail instruction', () => {
				const instruction = assembler.fail();
				chai.expect(instruction.op).to.equal('fail');
				chai.expect(instruction.func).to.equal(null);
			});

			it('appends the instruction to the program', () => {
				const instruction = assembler.fail();
				chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
			});
		});
		describe('conditional', () => {
			function conditional () {
				return false;
			}

			it('generates a fail instruction', () => {
				const instruction = assembler.fail(conditional);
				chai.expect(instruction.op).to.equal('fail');
				chai.expect(instruction.func).to.equal(conditional);
			});

			it('appends the instruction to the program', () => {
				const instruction = assembler.fail(conditional);
				chai.expect(assembler.program[assembler.program.length - 1]).to.equal(instruction);
			});
		});
	});
});
