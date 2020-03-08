# whynot.js

[![NPM version](https://badge.fury.io/js/whynot.svg)](https://badge.fury.io/js/whynot)
[![Build Status](https://travis-ci.org/bwrrp/whynot.js.svg?branch=master)](https://travis-ci.org/bwrrp/whynot.js)

Generic VM-based formal language matching framework, inspired by [http://swtch.com/~rsc/regexp/](http://swtch.com/~rsc/regexp/)

This library implements a VM able to execute programs aimed at matching
formal languages. It does so by considering all possible branches in
parallel. This could be used to efficiently implement many types of language
matching, including regular expressions and XML schemas. Furthermore, the
program could be set up to record its progress through both the input and the
language's grammar. This enables giving feedback on _why_ a given input does
not match the grammar rules in some way.

For an example showing how this library can be used, see
[Examples.tests.ts](https://github.com/bwrrp/whynot.js/blob/master/test/Examples.tests.ts)
in the test suite.

## Benchmarking

A simple benchmark is included in the `benchmark` directory. This script runs
a simple program including repetition and records on an input of 1000000
items. The directory also includes scripts for running the benchmark in
node.js, the SpiderMonkey shell and ChakraCore. Make sure these are
installed, open a shell in the benchmark directory and then run the
`run-all.sh` script. Alternatively, use one of the following, depending on
the engine to test on:

### Node.js

```sh
node --experimental-modules ./start.mjs
```

### SpiderMonkey shell

```sh
js52 -m ./start.mjs
```

### ChakraCore

```sh
ch ./start-chakra.js
```
