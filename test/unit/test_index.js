/* eslint-env node */

// Require all modules ending in '_spec' from the current directory
// and all subdirectories

const testsContext = require.context('.', true, /_spec$/);

testsContext.keys().forEach(function(path) {
    // try {
        testsContext(path);
    // } catch(err) {
    //     console.error('[ERROR] WITH SPEC FILE: ', path);
    //     console.error(err);
    // }
});
