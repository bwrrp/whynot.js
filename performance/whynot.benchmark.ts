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
		// Create a program similar to the ones used for completion / synthesis
		vm = whynot.compileVM(assembler => {
			// 0: Fork: run program or skip to end
			assembler.jump([1, 7]);
			// 1: Fork to either branch
			assembler.jump([2, 5]);
			// 2: Branch 1: Accept an input item
			assembler.test(() => true);
			// 3: Record acceptance
			assembler.record('T');
			// 4: End of branch
			assembler.jump([6]);
			// 5: Branch 2: record missing item
			assembler.record('M');
			// 6: Join branches, return to start
			assembler.jump([0]);
			// 7: End
			assembler.accept();
		});

		input = Array.from({ length: 1000000 }, () => 1);
	}
);
