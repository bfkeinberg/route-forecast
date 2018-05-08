const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const APP_DIR = path.resolve(__dirname, 'src/jsx');
const TEMPLATE_DIR = path.resolve(__dirname, 'src/templates');
const SRC_STATIC_DIR = path.resolve(__dirname, 'src/static');
const BUILD_DIR = path.resolve(__dirname, 'dist');
const STATIC_DIR = path.resolve(__dirname, 'dist/static');
const GPX_DIR = path.resolve(__dirname, 'node_modules/gpx-parse/dist');

module.exports = env => {
    return {
        entry: [
            'babel-polyfill',
            path.resolve(APP_DIR, 'index.js')
        ],
        module: {
            rules: [
                {test: /\.jsx?$/,
                    include: APP_DIR,
                    exclude: /node_modules/,
                    // how to include specific modules in babel
                    // include: [APP_DIR,QUERY_STRING_DIR,STRICT_URI_ENCODE_DIR],
                    // exclude: /node_modules\/(?!(query-string|strict-uri-encode)\/).*/,
                    loader: "babel-loader",
                    options: {
                        cacheDirectory: true,
                        babelrc: false,
                        presets: ["babel-preset-env", "babel-preset-react", "babel-preset-stage-0"],
                        // how to target specific browsers
                        // presets: [["babel-preset-env",{targets:{browsers:["last 3 versions","Explorer 11"]}}],"babel-preset-react","babel-preset-stage-0"],
                        plugins: ['babel-plugin-transform-runtime', "react-html-attrs", "transform-class-properties"],
                        // if we want to remove arrow functions as well
                        // plugins: ['babel-plugin-transform-runtime',"react-html-attrs", "transform-class-properties","transform-es2015-arrow-functions"],
                        comments: true
                    }
                },
                {
                    test: /\.js$/,
                    use: [{loader: "source-map-loader", options: {enforce: "pre"}}],
                },
                {
                    test: /\.tsx?$/,
                    exclude: /node_modules/,
                    loader: 'ts-loader'
                },
                {
                    test: /\.css$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader"
                    ]
                },
                {test: /\.(png|woff2?|ttf|eot)$/, loader: "url-loader?limit=100000"},
                {test: /\.(jpg|ico|svg)$/, loader: "file-loader"},
                {test: /\.htm$/, use: 'raw-loader'}
            ]
        },
        plugins: [
            new CleanWebpackPlugin([
                BUILD_DIR + '/*.*',
                STATIC_DIR + '/*.*'
            ], {watch: true, verbose: false}),
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: "[name].css",
                chunkFilename: "[id].css"
            }),
            new HtmlWebpackPlugin({
                title: 'Plan long bike ride',
                filename: path.resolve(BUILD_DIR, 'index.html'),
                template: path.resolve(TEMPLATE_DIR, 'base_index.html'),
                inject: false,
                minify: {minifyURLs: true, removeComments: true},
                chunksSortMode: 'none',
                sentryRelease: env.sentryRelease
                // favicon:'src/static/favicon.ico'
            }),
            new ScriptExtHtmlWebpackPlugin({
                custom: [
                    {
                        test: 'main', attribute: 'id', value: 'routeui'
                    },
                    {test: 'main', attribute: 'timezone_api_key', value: '{{ timezone_api_key }}'},
                    {test: 'main', attribute: 'maps_api_key', value: '{{ maps_key }}'},
                ]
            }),
            new CopyWebpackPlugin([{from: SRC_STATIC_DIR + '/favicon*.*', to: STATIC_DIR, flatten: true}])
        ],
            output:
        {
            path: STATIC_DIR,
                filename: "[name].[chunkhash].bundle.js",
                chunkFilename: '[name].bundle.js',
                sourceMapFilename: "[name].[chunkhash].bundle.js.map",
                publicPath: "static/"
        },
        resolve: {
            extensions: [
                '*',
                '.js',
                '.jsx',
                '.ts',
                '.tsx'
            ],
                modules:
            [
                "node_modules",
                GPX_DIR
            ],
                alias:
            {
                Images: SRC_STATIC_DIR
            }
        },
        node: {
            fs: 'empty'
        }
    }
};