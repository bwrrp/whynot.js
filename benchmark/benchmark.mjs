//const whynot = require('..');
import * as whynot from '../dist/whynot.mjs';

const vm = whynot.compileVM(assembler => {
	assembler.jump([1, 7]);
	assembler.jump([2, 5]);
	assembler.test(() => true);
	assembler.record('T');
	assembler.jump([6]);
	assembler.record('M');
	assembler.jump([0]);
	assembler.accept();
});

const input = Array.from({ length: 1000000 }, () => 1);

vm.execute(input);
