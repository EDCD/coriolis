const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = merge(common, {
  devtool: 'source-map',
  mode: 'development',
  optimization: {
    minimize: false,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
      'src/.htaccess',
      'src/iframe.html',
      'src/xdLocalStoragePostMessageApi.min.js',
      'src/ship-mappings.json'
    ]}),
    new WebpackNotifierPlugin({ alwaysNotify: true }),
    new webpack.NoEmitOnErrorsPlugin()
  ]
});
