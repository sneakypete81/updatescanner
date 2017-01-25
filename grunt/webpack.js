const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  build: {},

  watch: {
    watch: true,
  },

  options: {
    entry: {
      background: './src/app/background/background_script.js',
      main: './src/app/main/main_script.js',
      popup: './src/app/popup/popup_script.js',
      debug_storage: './src/app/debug_storage/debug_storage_script.js',
    },

    output: {
      path: 'build',
      filename: 'app/[name]/[name]_script.js',
    },

    resolve: {
      modules: [
        'src/lib',
        'node_modules',
      ],
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
    ],

    // This will expose source map files so that errors will point to your
    // original source files instead of the transpiled files.
    devtool: 'source-map',
  },
};
