const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const webpack = require('webpack');
//const HtmlCriticalPlugin = require("html-critical-webpack-plugin");
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const zlib = require("zlib");

//new HtmlCriticalPlugin({
//    base: path.resolve(__dirname, 'dist/server/views'),
//    src: 'index.ejs',
//    dest: 'index.ejs',
//    inline: true,
//    minify: true,
//    extract: false,
//    width: 1400,
//    height: 1200,
//    inlineImages: false,
//    assetPaths: ['dist/static'],
//    penthouse: {
//        renderWaitTime: 3000,
//        blockJSRequests: false,
//    }
//}),

module.exports = (env,argv) => merge(common(env,argv), {
    plugins: [
        new TerserPlugin({
            parallel: true,
            terserOptions: {
                ecma: 6,
            },
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
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
            debug: false,
            setCommits: {auto:true},
            deploy: {env:'production', name:'latest'}
        }),
        new CompressionPlugin({
            minRatio:0.85,
            filename: "[path][base].br",
            algorithm: "brotliCompress",
            test: /\.(js|css|html|svg|ttf|eot)$/,
            compressionOptions: {
               params: {
                 [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
               }
            },
            exclude:[
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
