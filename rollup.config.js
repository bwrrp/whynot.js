import sourcemaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';

const {
	exports: {
		'.': { require: CJS_DEST_FILE, import: ESM_DEST_FILE },
	},
} = require('./package.json');

export default {
	input: 'lib/index.js',
	output: [
		{ name: 'whynot', file: CJS_DEST_FILE, format: 'umd', exports: 'named', sourcemap: true },
		{ file: ESM_DEST_FILE, format: 'es', sourcemap: true },
	],
	plugins: [
		sourcemaps(),
		terser({
			mangle: {
				properties: {
					regex: /^_/,
				},
			},
		}),
	],
};
