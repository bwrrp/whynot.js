#!/bin/sh
echo "--- Node ---"
time node --experimental-modules ./start.mjs

echo "--- SpiderMonkey ---"
time js52 -m ./start.mjs

echo "--- ChakraCore ---"
time ch ./start-chakra.js
