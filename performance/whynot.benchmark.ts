import runner from './BenchmarkRunner';
import * as whynot from '../src/index';

let vm: whynot.VM<number, void, void>;
let input: number[];
runner.addBenchmark(
	'simple',
	() => {
		vm.execute(input);
	},
	() => {
		vm = whynot.compileVM(assembler => {
			assembler.jump([1, 7]);
			assembler.jump([2, 5]);
			assembler.test(() => true);
			assembler.record('T');
			assembler.jump([6]);
			assembler.record('M');
			assembler.jump([0]);
			assembler.accept();
		});

		input = Array.from({ length: 1000000 }, () => 1);
	}
);
