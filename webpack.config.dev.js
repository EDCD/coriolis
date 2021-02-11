const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const pkgJson = require('./package');
const buildDate = new Date();
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  devServer: {
    headers: { 'Access-Control-Allow-Origin': '*' }
  },
  mode: 'development',
  entry: {
    main: './src/app/index.js',
  },
  resolve: {
    // When requiring, you don't need to add these extensions
    extensions: ['.js', '.jsx', '.json', '.scss']
  },
  optimization: {
    minimize: false,
    usedExports: true
  },
  output: {
    path: path.join(__dirname, 'build'),
    chunkFilename: '[name].bundle.js',
    publicPath: '/'
  },
  plugins: [
    new CopyWebpackPlugin(['src/.htaccess', 'src/iframe.html', 'src/xdLocalStoragePostMessageApi.min.js']),
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'lib',
    //   filename: 'lib.js'
    // }),
    new HtmlWebpackPlugin({
      inject: true,
      template: path.join(__dirname, 'src/index.ejs'),
      version: pkgJson.version,
      date: buildDate,
      gapiKey: process.env.CORIOLIS_GAPI_KEY || ''
    }),
    new ExtractTextPlugin({
      filename: 'app.css',
      disable: false,
      allChunks: true
    }),
    new WebpackNotifierPlugin({ alwaysNotify: true }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  module: {
    rules: [
      { test: /\.css$/, loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' }) },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'sass-loader'] })
      },
      { test: /\.(js|jsx)$/, loaders: ['babel-loader'], include: path.join(__dirname, 'src') },
      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/octet-stream' },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=image/svg+xml' }
    ]
  }
};
