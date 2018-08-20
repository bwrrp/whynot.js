import minify from 'rollup-plugin-babel-minify';

const { main: MAIN_DEST_FILE, module: MODULE_DEST_FILE } = require('./package.json');

export default {
	input: 'lib/index.js',
	output: [
		{ name: 'whynot', file: MAIN_DEST_FILE, format: 'umd', exports: 'named', sourcemap: true },
		{ file: MODULE_DEST_FILE, format: 'es', sourcemap: true }
	],
	plugins: [
		minify({
			comments: false,
			sourceMap: true
		})
	]
};
