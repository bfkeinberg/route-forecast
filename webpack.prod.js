const merge = require('webpack-merge');
const common = require('./webpack.common.js');
var webpack = require('webpack');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
module.exports = merge(common, {
    plugins: [
        new webpack.optimize.UglifyJsPlugin({sourceMap:true}),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new webpack.optimize.AggressiveMergingPlugin({minSizeReduce:1.3}),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new CompressionPlugin({
            deleteOriginalAssets:true
        }),
        // new BundleAnalyzerPlugin()
    ]
});
