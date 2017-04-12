const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  build: {},

  watch: {
    watch: true,
    failOnError: false,
  },

  options: {
    entry: {
      background: './src/app/background/background_script.js',
      main: './src/app/main/main_script.js',
      popup: './src/app/popup/popup_script.js',
      settings: './src/app/settings/settings_script.js',
      debug_storage: './src/app/debug_storage/debug_storage_script.js',
    },

    output: {
      path: path.resolve(__dirname + '/../build'),
      filename: 'app/[name]/[name]_script.js',
    },

    resolve: {
      modules: [
        'src/lib',
        'node_modules',
      ],
    },

    externals: {
      jquery: 'jQuery',
    },

    plugins: [
      // Since some NodeJS modules expect to be running in Node, it is helpful
      // to set this environment var to avoid reference errors.
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),

      // Copy across all non-javascript files
      new CopyWebpackPlugin([
        {context: 'src', from: '**/*'},
      ],
      {ignore: ['*.js']}),

      // Copy across external dependencies. This is better than bundling, since
      // it's much faster and prevents web-ext lint issues.
      new CopyWebpackPlugin([
        {context: 'src', from: 'dependencies/**/*'},
      ]),

    ],

    // This will expose source map files so that errors will point to your
    // original source files instead of the transpiled files.
    devtool: 'source-map',
  },
};
