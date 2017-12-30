const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const webpack = require('webpack');
// const HtmlCriticalPlugin = require("html-critical-webpack-plugin");
const WebpackCritical = require('webpack-critical');

var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
module.exports = merge(common, {
    plugins: [
        new webpack.optimize.UglifyJsPlugin({sourceMap:true,comments:false}),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new webpack.optimize.AggressiveMergingPlugin({minSizeReduce:1.4}),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
/*        new HtmlCriticalPlugin({
            base: path.resolve(__dirname, 'dist/'),
            src: 'index.html',
            dest: 'index.html',
            inline: true,
            minify: true,
            extract: true,
            inlineImages: true,
            width: 1400,
            height: 1000,
            penthouse: {
                blockJSRequests: false,
            }
        }),*/
        new WebpackCritical({
            context: path.resolve(__dirname, 'dist/static')
        }),
        new CompressionPlugin({
            deleteOriginalAssets:true, minRatio:0.85, cache:true,
            test:[/\.css/,/\.ttf/,/\.eot/,/\.js/],
            exclude:[/\.png/,/\.ico/,/\.html/]
        }),
        // new BundleAnalyzerPlugin()
    ]
});
