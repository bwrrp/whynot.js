import minify from "rollup-plugin-babel-minify";

const { main: MAIN_DEST_FILE, module: MODULE_DEST_FILE } = require('./package.json');

export default {
    entry: 'lib/index.js',
    targets: [
        { dest: MAIN_DEST_FILE, format: 'umd' },
        { dest: MODULE_DEST_FILE, format: 'es' },
    ],
    moduleName: 'whynot',
    exports: 'named',
    sourceMap: true,
    plugins: [
        minify({
            comments: false,
            sourceMap: true
        })
    ]
}