const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BugsnagSourceMapUploaderPlugin, BugsnagBuildReporterPlugin } = require('webpack-bugsnag-plugins');
const pkgJson = require('./package');
const buildDate = new Date();

module.exports = {
  devtool: 'source-map',
  entry: {
    main: './src/app/index.js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.scss']
  },
  output: {
    path: path.join(__dirname, 'build'),
    chunkFilename: '[name].bundle.js',
    publicPath: '/',
    globalObject: 'this'
  },
  mode: 'production',
  optimization: {
    minimize: true,
    usedExports: true
  },
  plugins: [
    new CopyWebpackPlugin(['src/.htaccess', { from: 'src/schemas', to: 'schemas' }, {
      from: 'src/images/logo/*',
      flatten: true,
      to: ''
    }, 'src/iframe.html', 'src/xdLocalStoragePostMessageApi.min.js']),
    // new webpack.optimize.CommonsChunkPlugin({
    //  name: 'lib',
    //  filename: 'lib.[chunkhash:6].js'
    // }),
    new HtmlWebpackPlugin({
      inject: true,
      template: path.join(__dirname, 'src/index.ejs'),
      uaTracking: process.env.CORIOLIS_UA_TRACKING || '',
      gapiKey: process.env.CORIOLIS_GAPI_KEY || '',
      date: buildDate,
      version: pkgJson.version
    }),
    new ExtractTextPlugin({
      filename: '[hash:6].css',
      disable: false,
      allChunks: true
    }),
    // new BugsnagBuildReporterPlugin({
    //   apiKey: 'ba9fae819372850fb660755341fa6ef5',
    //   appVersion: `${pkgJson.version}-${buildDate.toISOString()}`
    // }, { /* opts */ }),
    // new BugsnagSourceMapUploaderPlugin({
    //   apiKey: 'ba9fae819372850fb660755341fa6ef5',
    //   overwrite: true,
    //   appVersion: `${pkgJson.version}-${buildDate.toISOString()}`
    // }),
    new InjectManifest({
      swSrc: './src/sw.js',
      importWorkboxFrom: 'cdn',
      swDest: 'service-worker.js'
    }),
  ],
  module: {
    rules: [
      { test: /\.css$/, loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader' }) },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'sass-loader'] })
      },
      { test: /\.(js|jsx)$/, loader: 'babel-loader?cacheDirectory=true', include: path.join(__dirname, 'src') },
      { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/font-woff' },
      { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=application/octet-stream' },
      { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: 'file-loader' },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: 'url-loader?limit=10000&mimetype=image/svg+xml' }
    ]
  }
};
