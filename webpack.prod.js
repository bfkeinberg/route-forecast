const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const webpack = require('webpack');
const HtmlCriticalPlugin = require("html-critical-webpack-plugin");
const BrotliPlugin = require('brotli-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
const ClosureCompilerPlugin = require('webpack-closure-compiler');

module.exports = merge(common, {
    plugins: [
        new ClosureCompilerPlugin({concurrency: 3}),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new webpack.optimize.AggressiveMergingPlugin({minSizeReduce:1.4}),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new HtmlCriticalPlugin({
            base: path.resolve(__dirname, 'dist/'),
            src: 'index.html',
            dest: 'index.html',
            inline: true,
            minify: true,
            extract: false,
            width: 1400,
            height: 1200,
            inlineImages: true,
            assetPaths: ['dist/static'],
            penthouse: {
                renderWaitTime: 6000,
                blockJSRequests: false,
                screenshots: {
                    basePath: 'homepage'
                },
            }
        }),
        new CompressionPlugin({
            minRatio:0.85, cache:true,
            test:[/\.css/,/\.ttf/,/\.eot/,/\.js/],
            exclude:[/\.png/,/\.ico/,/\.html/]
        }),
        new BrotliPlugin({
            asset: '[path].br[query]',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8
        }),
        // new BundleAnalyzerPlugin()
    ]
});
