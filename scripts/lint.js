require('./eslint.js');

console.log('WARNING: Skipping web-ext lint until ' +
            'https://github.com/mozilla/addons-linter/issues/1775 is fixed.');

// console.log('Running web-ext lint...');
//
// const webExt = require('web-ext').default;
// webExt.cmd.lint({
//   sourceDir: 'src',
// }, {
//   shouldExitProgram: false,
// });
