const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config.dev');

const devServerOptions = {
  hot: true,
  headers: {
    "Access-Control-Allow-Origin": "*"
  },
  historyApiFallback: {
    rewrites: [
      // For some reason connect-history-api-fallback does not allow '.' in the URL for history fallback...
      { from: /\/outfit\//, to: '/index.html' }
    ]
  },
  host: '0.0.0.0',
  port: 3300
};

const compiler = webpack(config);
const server = new WebpackDevServer(devServerOptions, compiler);

const runServer = async () => {
  console.log('Starting development server...');
  try {
    await server.start();
    console.log('Successfully started server on http://localhost:3300');
  } catch (err) {
    console.log('Error starting server:', err);
  }
};

runServer();
