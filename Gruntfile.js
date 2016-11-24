/* eslint-env node */

module.exports = function(grunt) {
  grunt.initConfig();

  grunt.registerTask('default', 'Lint and build the webextension.',
                     ['lint', 'build']);

  grunt.registerTask('build', 'Build the webextension.',
                     ['shell:webextBuild']);

  grunt.registerTask('run', 'Run the webextension with Firefox.',
                     ['env:firefoxBin', 'shell:webextRun']);

  grunt.registerTask('lint', 'Check for linter warnings.',
                     ['eslint', 'shell:webextLint']);

  grunt.registerTask('test', 'Run the unit tests.',
                     ['env:firefoxBin', 'karma:unit']);

  grunt.registerTask('test:debug', 'Run the unit tests in debug mode.',
                     ['env:firefoxBin', 'karma:debug']);


  // Custom environment variables for Firefox location
  // @TODO: allow file override for local customisation
  grunt.loadNpmTasks('grunt-env');
  grunt.config('env', {
    firefoxBin: {
      FIREFOX_BIN: 'firefox-dev',
      WEB_EXT_FIREFOX: 'firefox-dev',
      WEB_EXT_FIREFOX_PROFILE: 'dev-edition-default',
    },
  });

  // Use grunt-shell to launch web-ext
  const webExtCmd = function(envVarName, command, defaultArgs) {
    const webExtBinary = ['node', './node_modules/web-ext/bin/web-ext',
                          '--source-dir=addon'];
    const args = (envVarName in process.env) ? process.env[envVarName]
                                             : defaultArgs;
    return webExtBinary.concat([command]).concat(args).join(' ');
  };

  grunt.loadNpmTasks('grunt-shell');
  grunt.config('shell', {
    webextBuild: {
      command: webExtCmd('WEBEXT_BUILD', 'build', ['--artifacts-dir=dist']),
    },
    webextRun: {
      command: webExtCmd('WEBEXT_RUN', 'run'),
    },
    webextLint: {
      command: webExtCmd('WEBEXT_LINT', 'lint', []),
    },
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.config('eslint', {
    files: ['addon/lib/', 'addon/spec/', '*.js'],
  });

  grunt.loadNpmTasks('grunt-karma');
  grunt.config('karma', {
    options: {
      configFile: 'karma.conf.js',
    },
    unit: {},
    debug: {
      singleRun: false,
      autoWatch: true,
      reporters: ['dots', 'kjhtml'],
    },
  });
};
