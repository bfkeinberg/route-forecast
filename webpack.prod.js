const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var webpack = require('webpack');

module.exports = merge(common, {
    plugins: [
        new webpack.optimize.UglifyJsPlugin({sourceMap:true}),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    ]
});
