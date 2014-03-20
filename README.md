# whynot.js

Generic VM-based structure matching framework, inspired by [http://swtch.com/~rsc/regexp/](http://swtch.com/~rsc/regexp/)

This library implements a VM able to execute structure-matching programs while considering all possible branches in parallel. This could be used to efficiently implement many types of structure matching, including regular expressions and XML schemas. Furthermore, the program could be set up to record its progress through the structure. This enables giving feedback on a stream of incoming data does not match the expected structure.

TODO: usage details & examples
