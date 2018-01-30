const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const webpack = require('webpack');
var path = require('path');
// const HtmlCriticalPlugin = require("html-critical-webpack-plugin");

module.exports = merge(common, {
        plugins: [
            new webpack.LoaderOptionsPlugin({
                debug: true
            }),
/*            new HtmlCriticalPlugin({
                base: path.resolve(__dirname, 'dist/'),
                src: 'index.html',
                dest: 'index.html',
                inline: true,
                minify: false,
                extract: false,
                // inlineImages: true,
                // assetPaths: ['dist/static'],
                width: 1400,
                height: 1200,
                penthouse: {
                    blockJSRequests: false,
                    renderWaitTime: 6000,
                    keepLargerMediaQueries: true,
                    screenshots: {
                        basePath: 'homepage'
                    },
                }
            }),*/
        ],
        output: {
            pathinfo:true
        },
        devtool: 'eval-source-map'
    }
);
