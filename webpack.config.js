var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname,
  entry: path.join(__dirname, 'index.js'),

  output: {
    pathinfo: false,
    library: 'Objectspy',
    filename: "objectspy.js",
    path: path.join(__dirname, 'build'),
   },

  module: {
    loaders: [
      {test: /\.js$/, loader: 'babel-loader?experimental&playground', exclude: [/node_modules/]},
     ]
   },

  plugins: [
    new webpack.DefinePlugin({
      NODE_ENV: JSON.stringify('production'),
      DEBUG: false,
     }),
   ],
 };
