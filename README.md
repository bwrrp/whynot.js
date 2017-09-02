# whynot.js

[![NPM version](https://badge.fury.io/js/whynot.svg)](https://badge.fury.io/js/whynot)
[![Build Status](https://travis-ci.org/bwrrp/whynot.js.svg?branch=master)](https://travis-ci.org/bwrrp/whynot.js)
[![Greenkeeper badge](https://badges.greenkeeper.io/bwrrp/whynot.js.svg)](https://greenkeeper.io/)

Generic VM-based formal language matching framework, inspired by [http://swtch.com/~rsc/regexp/](http://swtch.com/~rsc/regexp/)

This library implements a VM able to execute programs aimed at matching formal languages. It does so by considering all possible branches in parallel. This could be used to efficiently implement many types of language matching, including regular expressions and XML schemas. Furthermore, the program could be set up to record its progress through both the input and the language's grammar. This enables giving feedback on *why* a given input does not match the grammar rules in some way.

For an example showing how this library can be used, see [Examples.tests.ts](https://github.com/bwrrp/whynot.js/blob/master/test/Examples.tests.ts) in the test suite.
