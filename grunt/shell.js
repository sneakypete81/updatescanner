// Use grunt-shell to launch web-ext

const webExtCmd = function(command, args=[]) {
  const webExtBinary = ['node', './node_modules/web-ext/bin/web-ext',
                        '--source-dir=build'];
  return webExtBinary.concat([command]).concat(args).join(' ');
};

module.exports = {
  webextBuild: {
    command: webExtCmd('build', ['--artifacts-dir=dist']),
  },
  webextRun: {
    command: webExtCmd('run'),
  },
  webextLint: {
    command: webExtCmd('lint'),
  },
};
