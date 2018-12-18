const path = require('path');
const webExt = require('web-ext').default;

exports.build = function() {
  console.log('Running "web-ext build"...');
  return webExt.cmd.build({
    sourceDir: 'src',
    artifactsDir: 'dist',
    overwriteDest: true,
  });
};

exports.lint = function() {
  console.log('Running web-ext lint...');
  return webExt.cmd.lint({
    sourceDir: 'src',
  }, {
    shouldExitProgram: false,
  });
};

exports.run = function() {
  console.log('Running "web-ext run"...');
  return webExt.cmd.run({
    sourceDir: path.resolve('src'),
    pref: 'javascript.options.strict=false',
  });
};

exports.sign = function(apiKey, apiSecret) {
  console.log('Running "web-ext sign"...');
  return webExt.cmd.sign({
    sourceDir: 'src',
    artifactsDir: 'dist',
    apiKey: apiKey,
    apiSecret: apiSecret,
    channel: 'unlisted',
  });
};
