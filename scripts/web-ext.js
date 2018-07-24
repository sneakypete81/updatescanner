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
  console.log('WARNING: Skipping web-ext lint until ' +
              'https://github.com/mozilla/addons-linter/issues/1775 is fixed.');

  // console.log('Running web-ext lint...');
  // return webExt.cmd.lint({
  //   sourceDir: 'src',
  // }, {
  //   shouldExitProgram: false,
  // });
};

exports.run = function() {
  console.log('Running "web-ext run"...');
  return webExt.cmd.run({
    sourceDir: 'src',
    pref: 'javascript.options.strict=false',
  });
};

exports.sign = function() {
  console.log('Running "web-ext sign"...');
  return webExt.cmd.sign({
    artifactsDir: 'dist',
    apiKey: 'none',
    apiSecret: 'none',
  });
};
