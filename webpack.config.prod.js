const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const { max } = require('lodash');

module.exports = merge(common, {
  // devtool: 'source-map',
  mode: 'production',
  optimization: {
    minimize: true,
  },
  output: {
    globalObject: 'this'
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        'src/.htaccess',
        'src/iframe.html',
        'src/xdLocalStoragePostMessageApi.min.js',
        { from: 'src/schemas', to: 'schemas' },
        {
          from: 'src/images/logo/*',
          to: '[name][ext]'
        }
    ]}),
    /* new HtmlWebpackPlugin({
      // uaTracking: process.env.CORIOLIS_UA_TRACKING || '',
    }), */
    new MiniCssExtractPlugin({
      filename: '[contenthash:6].css',
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
      swDest: 'service-worker.js'
    }),

  ]
});
