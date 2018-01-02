const path = require('path');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var APP_DIR = path.resolve(__dirname, 'src/jsx');
var TEMPLATE_DIR = path.resolve(__dirname, 'src/templates');
var SRC_STATIC_DIR = path.resolve(__dirname, 'src/static');
var BUILD_DIR = path.resolve(__dirname, 'dist');
var STATIC_DIR = path.resolve(__dirname, 'dist/static');
var GPX_DIR = path.resolve(__dirname, 'node_modules/gpx-parse/dist');

module.exports = {
    entry: ['whatwg-fetch',
        path.resolve(APP_DIR, 'main.js')
    ],
    module: {
        rules: [
            {test: /\.jsx?$/,
                include: APP_DIR,
                exclude: /node_modules/,
                loader: "babel-loader",
                options: {
                    cacheDirectory:true,
                    presets: ["babel-preset-env"],
                    plugins: ['babel-plugin-transform-runtime']
                }
            },
            {test: /\.js$/,
                use: [{loader:"source-map-loader",options:{enforce: "pre"}}],
            },
            { test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader' },
            { test: /\.css$/,
                use:
                ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [{loader:"css-loader", options: {modules:false, sourceMap:true, minimize:true}}]
                })
            },
            { test: /\.(png|woff2?|ttf|eot)$/, loader: "url-loader?limit=100000" },
            { test: /\.(jpg|ico|svg)$/, loader: "file-loader" },
            { test: /\.htm$/, use: 'raw-loader'}
        ]
    },
    plugins: [
        new CleanWebpackPlugin([BUILD_DIR + '/*.*',STATIC_DIR + '/*.*'] , {watch:true, verbose:false}),
        new ExtractTextPlugin({filename:"styles.css",allChunks:true}),
        new HtmlWebpackPlugin({
            title:'Find weather forecast for route',
            filename:path.resolve(BUILD_DIR, 'index.html'),
            template:path.resolve(TEMPLATE_DIR,'base_index.html'),
            inject:false,
            minify:{minifyURLs:true,removeComments:true},
            // favicon:'src/static/favicon.ico'
        }),
        new ScriptExtHtmlWebpackPlugin({custom:[{
            test:'main',attribute:'id',value:'routeui'},
            {test:'main',attribute:'timezone_api_key',value:'{{ timezone_api_key }}'},
            {test:'main',attribute:'maps_api_key',value:'{{ maps_key }}'},
        ]}),
        new webpack.ProvidePlugin({
            fetch: 'imports-loader?this=>global!exports-loader?global.fetch!whatwg-fetch'
        }),
        new CopyWebpackPlugin([{from:SRC_STATIC_DIR + '/favicon*.*',to:STATIC_DIR, flatten:true}])
    ],
    output: {
        path: STATIC_DIR,
        filename: "[name].bundle.js",
        chunkFilename: '[name].bundle.js',
        publicPath: "/static/"
    },
    resolve: {
        extensions: ['*', '.js', '.jsx', '.ts', '.tsx'],
        modules: ["node_modules", GPX_DIR],
        alias: {Images: SRC_STATIC_DIR}
    },
    node: {
        fs: 'empty'
    }
}