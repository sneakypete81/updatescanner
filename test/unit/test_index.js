/* eslint-env node */

// Require all modules ending in '_spec' from the current directory
// and all subdirectories
const testsContext = require.context('.', true, /_spec$/);
testsContext.keys().forEach(function(path) {
  testsContext(path);
});

// Require all modules in src/lib, to enable full code coverage
// Ignore filenames staring with '.'
const srcContext = require.context('../../src/lib', true, /\.js$/);
srcContext.keys().forEach(function(path) {
  srcContext(path);
});
