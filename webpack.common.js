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
const SERVER_DIR = path.resolve(__dirname, 'dist/server');
const VIEWS_DIR = path.resolve(SERVER_DIR, 'views');

module.exports = (env,argv) => {
    const mode = argv === undefined ? 'development' : argv.mode;
    return {
        mode:mode,
        entry: [
            path.resolve(APP_DIR, 'app/app.jsx')
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
                        presets: ["@babel/env", "@babel/preset-react"],
                        // how to target specific browsers
                        // presets: [["babel-preset-env",{targets:{browsers:["last 3 versions","Explorer 11"]}}],"babel-preset-react","babel-preset-stage-0"],
                        plugins: ['@babel/transform-runtime', "react-html-attrs", "transform-class-properties","react-hot-loader/babel","@babel/plugin-syntax-dynamic-import"],
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
                    test: /\.scss$/,
                    use: [
                        "style-loader", // creates style nodes from JS strings
                        "css-loader", // translates CSS into CommonJS
                        "sass-loader" // compiles Sass to CSS, using Node Sass by default
                    ]
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
            new CleanWebpackPlugin({}),
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: "[name].css",
                chunkFilename: "[id].css"
            }),
            new HtmlWebpackPlugin({
                title: 'Plan and forecast bicycle ride',
                filename: path.resolve(VIEWS_DIR, 'index.ejs'),
                template: path.resolve(TEMPLATE_DIR, 'base_index.html'),
                inject: false,
                minify: {minifyURLs: true, removeComments: true},
                chunksSortMode: 'none',
                sentryRelease: env.sentryRelease,
                mode: mode
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
            new CopyWebpackPlugin([{from: SRC_STATIC_DIR + '/favicon*.*', to: STATIC_DIR, flatten: true},
                {from: SRC_STATIC_DIR + '/apple-*.*', to: STATIC_DIR, flatten: true}]),
        ],
        output:
        {
            path: STATIC_DIR,
            filename: "[name].bundle.js",
            chunkFilename: '[name].bundle.js',
            sourceMapFilename: "[name].bundle.js.map",
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
                "node_modules"
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