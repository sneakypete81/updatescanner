/* eslint-env node */

module.exports = function(grunt) {
  grunt.initConfig();

  grunt.registerTask('default', 'Lint and build the webextension.',
                     ['lint', 'test', 'build']);

  grunt.registerTask('build', 'Build the webextension.',
                     ['shell:webextBuild']);

  grunt.registerTask('run', 'Run the webextension with Firefox.',
                     ['env:webextRun', 'shell:webextRun']);

  grunt.registerTask('lint', 'Check for linter warnings.',
                     ['eslint', 'shell:webextLint']);

  grunt.registerTask('test', 'Run the unit tests.',
                     ['env:karma', 'karma:unit']);

  grunt.registerTask('test:debug', 'Run the unit tests in debug mode.',
                     ['env:karma', 'karma:debug']);


  // Custom environment variables for Firefox
  // Uses options.add so that these can be overridden by the environment.
  grunt.loadNpmTasks('grunt-env');
  grunt.config('env', {
    karma: {options: {add:{
      FIREFOX_BIN: 'firefox-developer',
    }}},
    webextRun: {options: {add:{
      WEB_EXT_FIREFOX: 'firefox-developer',
      WEB_EXT_FIREFOX_PROFILE: 'dev-edition-default',
    }}},
  });

  // Use grunt-shell to launch web-ext
  const webExtCmd = function(command, args=[]) {
    const webExtBinary = ['node', './node_modules/web-ext/bin/web-ext',
                          '--source-dir=addon'];
    return webExtBinary.concat([command]).concat(args).join(' ');
  };

  grunt.loadNpmTasks('grunt-shell');
  grunt.config('shell', {
    webextBuild: {
      command: webExtCmd('build', ['--artifacts-dir=dist']),
    },
    webextRun: {
      command: webExtCmd('run'),
    },
    webextLint: {
      command: webExtCmd('lint'),
    },
  });

  grunt.loadNpmTasks('grunt-eslint');
  grunt.config('eslint', {
    options: {
      ignorePattern: ['node_modules/', 'addon/dependencies/'],
      maxWarnings: 0,
    },
    target: ['.'],
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
      reporters: ['dots', 'kjhtml', 'notification'],
    },
  });
};
