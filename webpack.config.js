const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const pkg = require("./package.json");
const ZipPlugin = require("zip-webpack-plugin");

const nodeModules = {};
fs.readdirSync("node_modules")
  .filter((x) => {
    return [".bin"].indexOf(x) === -1;
  })
  .forEach((mod) => {
    nodeModules[mod] = "commonjs " + mod;
  });

module.exports = {
  entry: "./src/index.js",
  target: "node",
  output: {
    path: path.join(__dirname, "dist", "logging-module", pkg.version),
    filename: "index.js"
  },
  externals: nodeModules,
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.BannerPlugin({ banner: "require("source-map-support").install();", raw: true, entryOnly: false }),
    new MinifyPlugin(),
    new ZipPlugin({
      path: path.join(__dirname, "dist"),
      filename: "logging-module",
      pathPrefix: "logging-module/" + pkg.version,
    })
  ],
  devtool: "sourcemap"
};
