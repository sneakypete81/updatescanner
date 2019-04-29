module.exports = {
  extends: ['../.eslintrc.js'],

  // We use require, not import - that means we can avoid webpacking.
  parserOptions: {
    'sourceType': 'script',
  },
  env: {
    'node': true,
  },
};
