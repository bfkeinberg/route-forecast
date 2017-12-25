var path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
var webpack = require('webpack');

var BUILD_DIR = path.resolve(__dirname, 'src/static/scripts/js');
var APP_DIR = path.resolve(__dirname, 'src/static/scripts/jsx');
var GPX_DIR = path.resolve(__dirname, 'node_modules/gpx-parse/dist');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    entry: ['whatwg-fetch',
        APP_DIR + '/main.js'
    ],
    module: {
        rules: [
            {test: /\.jsx?$/,
                include: APP_DIR,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: {
                    cacheDirectory:true
                }
            },
            {test: /\.js$/,
                use: [{loader:"source-map-loader",options:{enforce: "pre"}}],
            },
            { test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader' },
            { test: /\.css$/, use:
                ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [{loader:"css-loader", options: {modules:false, sourceMap:true, minimize:true}}]
                })
            },
            { test: /\.(png|woff2?)$/, loader: "url-loader?limit=100000" },
            { test: /\.jpg$/, loader: "file-loader" },
            { test: /\.(ttf|eot|svg)$/, loader: "file-loader" }
        ]
    },
    plugins: [
        new ExtractTextPlugin("styles.css"),
        new CleanWebpackPlugin([BUILD_DIR + '/*.*'] , {watch:true, verbose:true}),
        new webpack.ProvidePlugin({
            fetch: 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch'
        })
    ],
    output: {
        path: BUILD_DIR,
        filename: "bundle.js",
    },
    resolve: {
        extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
        modules: ["node_modules", GPX_DIR]
    },
    externals: {
        jquery: 'jQuery'
    },
    node: {
        fs: 'empty'
    }
}