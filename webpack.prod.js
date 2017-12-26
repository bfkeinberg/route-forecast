const merge = require('webpack-merge');
const path = require('path');
const common = require('./webpack.common.js');
var webpack = require('webpack');
const glob = require('glob');
const PurifyCSSPlugin = require('purifycss-webpack');
// var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
module.exports = merge(common, {
    plugins: [
        new PurifyCSSPlugin({ paths: glob.sync(path.join(__dirname, 'src/static/scripts/jsx/*.js')), minimize:true }),
        new webpack.optimize.UglifyJsPlugin({sourceMap:true,comments:false}),
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
