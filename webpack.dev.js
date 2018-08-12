const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = (env,argv) => merge.strategy(
    {
        entry: 'prepend'
    })(common(env,argv), {
    entry:['react-hot-loader/patch','webpack-hot-middleware/client'],
    output: {
        pathinfo:true,
        filename: "[name].[hash].bundle.js",
        sourceMapFilename: "[name].[hash].bundle.js.map",
    },
    plugins:[
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ],
    devtool: 'source-map',
    }
);
