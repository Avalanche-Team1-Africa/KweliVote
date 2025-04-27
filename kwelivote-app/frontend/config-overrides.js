const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = function override(config, env) {
  // Add Node.js polyfills
  config.resolve.fallback = {
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "assert": require.resolve("assert/"),
    "http": require.resolve("stream-http"),
    "https": require.resolve("https-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "buffer": require.resolve("buffer/"),
    "util": require.resolve("util/"),
    "url": require.resolve("url/"),
    "path": require.resolve("path-browserify"),
    "zlib": require.resolve("browserify-zlib"),
    "fs": false
  };

  // Add plugins
  config.plugins.push(
    new NodePolyfillPlugin()
  );

  // Return the modified config
  return config;
};