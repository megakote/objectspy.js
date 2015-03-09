var path = require('path');
var webpack = require('webpack');

module.exports = ['bin', 'lib'].map(function(type){
  var config = {
    name: type,
    context: __dirname,
    entry: path.join(__dirname, type === 'bin' ? 'index.js' : 'src/objectspy.es6.js'),

    output: {
      pathinfo: false,
      path: path.join(__dirname, type),
      filename: "objectspy.js",
      library: 'Objectspy',
      libraryTarget: type == 'bin' ? 'var' : 'commonjs2',
      sourcePrefix: '',
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


  if (type === 'bin')
    config.plugins.push( new webpack.optimize.UglifyJsPlugin({minimize: true}) );

  return config;
 });


