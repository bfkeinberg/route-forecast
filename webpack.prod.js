const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const webpack = require('webpack');
const HtmlCriticalPlugin = require("html-critical-webpack-plugin");
const BrotliPlugin = require('brotli-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const SentryCliPlugin = require('@sentry/webpack-plugin');

module.exports = (env,argv) => merge(common(env,argv), {
    plugins: [
        new TerserPlugin({
            parallel: true,
            sourceMap: true,
            terserOptions: {
                ecma: 6,
            },
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new HtmlCriticalPlugin({
            base: path.resolve(__dirname, 'dist/server/views'),
            src: 'index.ejs',
            dest: 'index.ejs',
            inline: true,
            minify: true,
            extract: false,
            width: 1400,
            height: 1200,
            inlineImages: false,
            assetPaths: ['dist/static'],
            penthouse: {
                renderWaitTime: 3000,
                blockJSRequests: false,
            }
        }),
        new SentryCliPlugin({
            include: '.',
            ignoreFile: '.sentrycliignore',
            ignore: [
                'node_modules',
                'webpack.prod.js',
                'webpack.common.js',
                'webpack.dev.js'
            ],
            configFile: 'sentry.properties',
            rewrite:true,
            stripPrefix: ['/dist'],
            stripCommonPrefix: true,
            urlPrefix: '/static',
            debug: true
        }),
        new CompressionPlugin({
            minRatio:0.85, cache:true,
            test: [
                /\.css/,
                /\.ttf/,
                /\.eot/,
                /\.js/
            ],
            exclude:[
                /\.png/,
                /\.ico/,
                /\.html/
            ]
        }),
        new BrotliPlugin({
            asset: '[path].br[query]',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240,
            minRatio: 0.8
        }),
        // new BundleAnalyzerPlugin()
    ],
    devtool: 'source-map'
});
