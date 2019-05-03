const merge = require('webpack-merge');
const clientCommon = require('./webpack.common.js');
const webpack = require('webpack');

module.exports = (env, argv) => merge.strategy(
    {
        entry: 'prepend'
    })(clientCommon(env,argv), {
        entry:[
            'react-hot-loader/patch',
            'webpack-hot-middleware/client'
        ],
        output: {
            pathinfo:true,
            filename: "[name].bundle.js",
            chunkFilename: '[name].bundle.js',
            sourceMapFilename: "[name].bundle.js.map",
        },
        plugins:[
            new webpack.HotModuleReplacementPlugin(),
            // new webpack.NoEmitOnErrorsPlugin()
        ],
        devtool: 'source-map',
        optimization: {
            noEmitOnErrors: true
        }
    }
);
