import babili from 'rollup-plugin-babili';

export default {
    entry: 'lib/index.js',
    dest: 'dist/whynot.min.js',
    format: 'umd',
    moduleName: 'whynot',
    exports: 'named',
    sourceMap: true,
    plugins: [
        babili({
            comments: false,
            sourceMap: true
        })
    ]
}