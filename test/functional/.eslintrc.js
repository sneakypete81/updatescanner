module.exports = {
  extends: ['../.eslintrc.js'],

  // We use require, not import
  parserOptions: {
    'sourceType': 'script',
  },
  env: {
    'node': true,
  },
};
