require('./clean.js');
require('./copy-dependencies.js');

console.log('Running "web-ext build"...');

const webExt = require('web-ext').default;
webExt.cmd.build({
  sourceDir: 'src',
  artifactsDir: 'dist',
  overwriteDest: true,
});
