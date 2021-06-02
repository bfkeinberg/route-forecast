const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const zlib = require("zlib");

module.exports = (env,argv) => merge(common(env,argv), {
    plugins: [
        new TerserPlugin({
            parallel: true,
            terserOptions: {
                ecma: 6,
            },
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new CompressionPlugin({
            filename: "[path][base].br",
            algorithm: "brotliCompress",
          test: /\.(js|css|html|svg)$/,
          compressionOptions: {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
            },
          },
          threshold: 10240,
          deleteOriginalAssets: false,
          minRatio:0.85,
            exclude:[
                /\.png/,
                /\.ico/,
                /\.html/
            ]
        }),
         new BundleAnalyzerPlugin()
    ],
    optimization: {
        minimizer: [
           `...`,
          new CssMinimizerPlugin({parallel:4}),
        ],
      },
    devtool: 'source-map'
});
