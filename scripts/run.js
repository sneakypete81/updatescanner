require('./clean.js');
require('./copy-dependencies.js');

console.log('Running "web-ext run"...');

const webExt = require('web-ext').default;
webExt.cmd.run({
  sourceDir: 'src',
  pref: 'javascript.options.strict=false',
});
