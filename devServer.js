var webpack = require('webpack');
var WebpackDevServer = require("webpack-dev-server");
var config = require('./webpack.config.dev');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  disableHostCheck: true,
  headers: { "Access-Control-Allow-Origin": "*" },
  historyApiFallback: {
    rewrites: [
      // For some reason connect-history-api-fallback does not allow '.' in the URL for history fallback...
      { from: /\/outfit\//, to: '/index.html' }
    ]
  },
  stats: {
    assets: true,
    colors: true,
    version: false,
    hash: false,
    timings: true,
    chunks: false,
    chunkModules: false
  }
}).listen(process.env.PORT || 3300, "0.0.0.0", function (err, result) {
  if (err) {
    console.log(err);
  }

  console.log(`Listening at localhost:${process.env.PORT || 3300}`);
});
