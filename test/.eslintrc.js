// @TODO: Add eslint-plugin-jasmine
module.exports = {
  extends: ['../.eslintrc.js'],

  parserOptions: {
    'sourceType': 'module',
  },

  env: {
    'jasmine': true,
    'jquery': true,
  },

  rules: {
    'require-jsdoc': 'off',
    // Complain if specs are left focussed
    'no-restricted-globals': ['warn', 'fdescribe', 'fit'],
    // Jasmine uses 'this' to share variables
    'no-invalid-this': 'off',
  },
};
