const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const zlib = require("zlib");

module.exports = (env, argv) => merge(common(env, argv), {
    plugins: [
        new TerserPlugin({
            parallel: true,
            terserOptions: {
                ecma: 6,
            },
        }),
        new webpack.IgnorePlugin({
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
        }),
        new SentryCliPlugin({
            include: '.',
            ignoreFile: '.sentrycliignore',
            ignore: [
                'node_modules',
                'webpack.prod.js',
                'webpack.common.js',
                'webpack.dev.js',
                'dist/server',
                'setupFile.js'
            ],
            configFile: 'sentry.properties',
            rewrite: true,
            stripPrefix: ['/dist'],
            stripCommonPrefix: true,
            urlPrefix: '/static',
            debug: false,
            setCommits: { auto: true },
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
