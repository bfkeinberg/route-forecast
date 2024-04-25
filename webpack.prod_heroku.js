/* eslint-disable no-undef */
const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const webpack = require('webpack');
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const zlib = require("zlib");

module.exports = (env, argv) => merge(common(env, argv), {
    plugins: [
        new TerserPlugin({
            parallel: true
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
        }),
        sentryWebpackPlugin({
            include: '.',
            ignoreFile: '.sentrycliignore',
            ignore: [
                'node_modules',
                'webpack.prod.js',
                'webpack.common.js',
                'webpack.dev.js',
                'setupFile.js'
            ],
            configFile: 'sentry.properties',
            org: 'brian-feinberg',
            project: 'randoplan',
            rewrite: true,
            stripPrefix: ['/dist'],
            stripCommonPrefix: true,
            urlPrefix: '/static',
            debug: true,
            setCommits: { auto: true },
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: {name: process.env.SOURCE_VERSION},
            reactComponentAnnotation: {enabled:true},
            deploy: { env: 'production', name: 'latest' }
        }),
        new CompressionPlugin({
            minRatio: 0.85,
            filename: "[path][base].br",
            algorithm: "brotliCompress",
            test: /\.(js|css|html|svg|ttf|eot)$/,
            compressionOptions: {
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                }
            },
            exclude: [
                /\.png/,
                /\.ico/,
                /\.html/
            ]
        }),
        // new BundleAnalyzerPlugin()
    ],
    optimization: {
        minimizer: [
            `...`,
            new CssMinimizerPlugin(),
        ],
    },
    devtool: 'source-map'
});
