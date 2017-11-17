const path = require('path')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: {
    index:"./src/index.js"
  },
  output: {
    path: path.resolve(`./dist`),
    filename: `nokey-tinypng-webpack-plugin.js`,
  },
  module: {
    rules: [
      {test: /\.js$/,exclude: /node_modules/,use: 'babel-loader'},
    ]
  },
  plugins: [
    new UglifyJSPlugin()
  ]
}
