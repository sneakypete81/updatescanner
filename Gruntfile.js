/* eslint-env node */

module.exports = function(grunt) {
  // Gruntfile

  const webExtCmd = function(envVarName, command, defaultArgs) {
    const webExtBinary = ['node', './node_modules/web-ext/bin/web-ext'];
    const args = (envVarName in process.env) ? process.env[envVarName]
                                             : defaultArgs;
    return webExtBinary.concat([command]).concat(args).join(' ');
  };

  // Project configuration.
  grunt.initConfig({
    shell: {
      webextBuild: {
        command: webExtCmd('WEBEXT_BUILD', 'build', ['--artifacts-dir=.build']),
      },
      webextRun: {
        command: webExtCmd('WEBEXT_RUN', 'run',
                           ['--firefox=firefox-dev',
                            '--firefox-profile=dev-edition-default']),
      },
      webextLint: {
        command: webExtCmd('WEBEXT_LINT', 'lint', []),
      },
    },

    eslint: {
      'files': ['lib/', 'test/', '*.js'],
    },

    jasmine: {
      src: 'lib/**/*.js',
      options: {
        specs: 'spec/**/*_spec.js',
        vendor: [
          'node_modules/jquery/dist/jquery.js',
          'node_modules/jasmine-jquery/lib/jasmine-jquery.js',
        ],
      },
    },

  });

  // Load plugins
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');

  // Register tasks
  grunt.registerTask('build', ['shell:webextBuild']);
  grunt.registerTask('run', ['shell:webextRun']);
  grunt.registerTask('lint', ['eslint',
                              'shell:webextLint']);
  grunt.registerTask('test', ['jasmine']);
};
