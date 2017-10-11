const path = require("path");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const pkg = require("./package.json");
const ZipPlugin = require("zip-webpack-plugin");
const UnzipsfxPlugin = require("unzipsfx-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');



const nodeExternals = require('webpack-node-externals');module.exports = {
  entry: "./src/index.js",
  target: "node",
  externals: [nodeExternals()],
  output: {
    path: path.join(__dirname, "dist", "logging-module", pkg.version),
    filename: "index.js"
  },
  plugins: [
    new CopyWebpackPlugin([{from: "./temp/node_modules", to: 'node_modules'}]),
    new MinifyPlugin(),
    new ZipPlugin({
      path: path.join(__dirname, "dist"),
      filename: "logging-module",
    }),
    new UnzipsfxPlugin({
      outputPath: path.join(__dirname, "dist"),
      outputFilename: "logging-module",
    })
  ]
};
