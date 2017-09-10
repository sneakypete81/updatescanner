// Use grunt-shell to launch web-ext

const settings = require('./settings');


/**
 * Create a command list to run web-ext.
 *
 * @param {type} command - The web-ext command to use (build, run, etc).
 * @param {Array.<string>} args - Additional arguments to pass to web-ext.
 *
 * @returns {Array.<string>} Full command array.
 */
function webExtCmd(command, args=[]) {
  const webExtBinary = ['node', './node_modules/web-ext/bin/web-ext',
                        '--source-dir=build'];
  return webExtBinary.concat([command]).concat(args).join(' ');
}

module.exports = {
  webextBuild: {
    command: webExtCmd('build', [
      '--artifacts-dir=dist',
      // Will be required for web-ext >1.9.1
      // '--overwrite-dest',
    ]),
  },
  webextRun: {
    command: webExtCmd('run', [
      '--firefox=' + settings.get('firefox', 'firefox'),
      '--pref=devtools.theme=light',
      '--pref=javascript.options.strict=false',
    ]),
  },
  webextLint: {
    command: webExtCmd('lint', [
      // Ignore dependencies (JQuery, etc)
      '--ignore-files="dependencies/**/*"',
    ]),
  },
  webextSign: {
    command: webExtCmd('sign', [
      '--artifacts-dir=dist',
      '--api-key=' + settings.get('api_key', ''),
      '--api-secret=' + settings.get('api_secret', ''),
    ]),
  },

};
