const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');

const APP_DIR = path.resolve(__dirname, 'src/jsx');
const TEMPLATE_DIR = path.resolve(__dirname, 'src/templates');
const SRC_STATIC_DIR = path.resolve(__dirname, 'src/static');
const BUILD_DIR = path.resolve(__dirname, 'dist');
const SERVER_DIR = path.resolve(__dirname, 'dist/server');
const VIEWS_DIR = path.resolve(SERVER_DIR, 'views');
const GPX_DIR = path.resolve(__dirname, 'node_modules/gpx-parse/dist');
const nodeExternals = require('webpack-node-externals');

module.exports = (env,argv) => {
    const mode = argv === undefined ? 'development' : argv.mode;
    return {
        target: "node",
        mode:mode,
        externals: [nodeExternals({
            // load non-javascript files with extensions, presumably via loaders
            whitelist: [/\.(?!(?:jsx?|json)$).{1,5}$/i],
        })],
        entry: [
            path.resolve(APP_DIR, 'server/index.js')
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
            new CleanWebpackPlugin([
                BUILD_DIR + '/*.*',
                SERVER_DIR + '/*.*'
            ], {watch: true, verbose: false}),
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: "[name].css",
                chunkFilename: "[id].css"
            })
        ],
            output:
        {
            path: SERVER_DIR,
                filename: "[name].bundle.js",
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
                "node_modules",
                GPX_DIR,
                '.'
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