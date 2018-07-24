exports.build = function() {
  console.log('Running "web-ext build"...');

  const webExt = require('web-ext').default;
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
  //
  // const webExt = require('web-ext').default;
  // return webExt.cmd.lint({
  //   sourceDir: 'src',
  // }, {
  //   shouldExitProgram: false,
  // });
};

exports.run = function() {
  console.log('Running "web-ext run"...');

  const webExt = require('web-ext').default;
  return webExt.cmd.run({
    sourceDir: 'src',
    pref: 'javascript.options.strict=false',
  });
};
