const path = require('path');
const APP_DIR = path.resolve(__dirname, 'src/jsx');

const merge = require('webpack-merge');
const serverCommon = require('./webpack.server.common.js');
const BrotliPlugin = require('brotli-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');

const server = (env, argv) => merge.strategy(
    {
        entry: 'prepend'
    })(serverCommon(env,argv), {
        entry:[path.resolve(APP_DIR, 'server/logging.js')],
        target: "node",
        devtool: 'source-map',
        output: {
            pathinfo: true
        },
        plugins: [
            new TerserPlugin({
                parallel: true,
                sourceMap: true,
                terserOptions: {
                    ecma: 6,
                },
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
            })
        ],
    }
);

module.exports = [server];
