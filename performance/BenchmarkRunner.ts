import Benchmark from 'benchmark';

class BenchmarkRunner {
	private readonly _benchmarks: {
		benchmark: Benchmark;
		setup?: () => void;
		teardown?: () => void;
	}[] = [];

	public addBenchmark(
		name: string,
		test: () => void,
		setup?: () => void,
		teardown?: () => void
	): void {
		this._benchmarks.push({
			benchmark: new Benchmark(name, test),
			// We do not use the setup and teardown which is offered withing the API of benchmarkjs
			// as several attempts to get this working did not yield any successful results.
			setup,
			teardown
		});
	}

	public run(): void {
		console.log(`Running ${this._benchmarks.length} benchmarks`);
		for (const benchmark of this._benchmarks) {
			if (benchmark.setup !== undefined) {
				benchmark.setup();
			}

			benchmark.benchmark.on('complete', (event: Event) => {
				console.log(String(event.target));

				const error = (event.target as any).error;
				if (error) {
					console.error(error);
				}
			});

			benchmark.benchmark.run({ async: false });

			if (benchmark.teardown !== undefined) {
				benchmark.teardown();
			}
		}
	}
}

const runner = new BenchmarkRunner();
export default runner;
