/* eslint-disable no-undef */
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const SRC_DIR = path.resolve(__dirname, "src")
const APP_DIR = path.resolve(__dirname, 'src/jsx');
const TEMPLATE_DIR = path.resolve(__dirname, 'src/templates');
const SRC_STATIC_DIR = path.resolve(__dirname, 'src/static');
const SRC_SERVER_DIR = path.resolve(SRC_DIR, 'server');
const BUILD_DIR = path.resolve(__dirname, 'dist');
const STATIC_DIR = path.resolve(BUILD_DIR, 'static');
const SERVER_DIR = path.resolve(BUILD_DIR, 'server');
const VIEWS_DIR = path.resolve(SERVER_DIR, 'views');
var webpack = require('webpack');

module.exports = (env,argv) => {
    const mode = argv === undefined ? 'development' : argv.mode;
    const devMode = process.env.NODE_ENV !== "production"
    return {
        mode:mode,
        cache: {
            type:'filesystem'
        },
        entry: [path.resolve(APP_DIR, 'app/app.jsx')],
        module: {
            rules: [
                {
                    test: /\.(js|css|scss)$/,
                    enforce: "pre",
                    use: [{loader: "source-map-loader"}],
                    "exclude": [
                        path.join(process.cwd(), 'node_modules/react-responsive'),
                        path.join(process.cwd(), 'node_modules/@blueprintjs')
                    ],
                },
                {
                    test: /\.(t|j)sx?$/,
                    use: {loader: 'ts-loader'} ,
                    exclude: /node_modules/
                },
                {
                    test: /\.scss$/,
                    use: [
                        devMode ? "style-loader" : MiniCssExtractPlugin.loader, // creates style nodes from JS strings
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
                {test: /\.(png|woff2?|ttf|eot)$/,
                    type: "asset",
                    parser: {
                        dataUrlCondition: {
                            maxSize: 100000
                        }
                    }
                },
                {test: /\.(jpg|ico|svg|gif)$/, type: "asset/resource"},
                {test: /\.htm$/, type: "asset/source"}
            ]
        },
        plugins: [
            new CleanWebpackPlugin({}),
            // new webpack.DefinePlugin({SENTRY_RELEASE: JSON.stringify(env.sentryRelease), "process.env": "{}"}),
            new webpack.ProvidePlugin({
                Buffer: [
                    'buffer',
                 'Buffer'
                ]
            }),
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
            new CopyWebpackPlugin({patterns:[
                {from: SRC_STATIC_DIR + '/favicon*.*', to: path.resolve(STATIC_DIR, "[name][ext]")},
                {from: SRC_STATIC_DIR + '/apple-*.*', to: path.resolve(STATIC_DIR, "[name][ext]")},
                {from: 'manifest.json', to: path.resolve(STATIC_DIR, "[name][ext]")},
                {from: 'src/pwa/worker.js', to: path.resolve(STATIC_DIR, "[name][ext]")},
                {from: 'node_modules/localforage/dist/localforage.min.js', to: path.resolve(STATIC_DIR, "lib/localforage.js")},
                {from: 'source-context.json', to: path.resolve(SERVER_DIR, "[name][ext]")},
                {from:SRC_SERVER_DIR + '/*.js', to:path.resolve(SERVER_DIR, "[name][ext]"), info: { minimized: true }}
                ]})
        ],
        output:
        {
            path: STATIC_DIR,
            pathinfo:true,
            filename: "[name].bundle.[contenthash].js",
            chunkFilename: '[name].bundle.js',
            // sourceMapFilename: "[name].bundle.js.map",
            publicPath: "static/"
        },
        resolve: {
            extensions: [
                '*',
                '.ts',
                '.tsx',
                '.js',
                '.jsx'
            ],
            extensionAlias: {
                ".js": [".js", ".ts"],
                ".cjs": [".cjs", ".cts"],
                ".mjs": [".mjs", ".mts"]
            },
            modules:
                ["node_modules"],
            alias:
            {
                Images: SRC_STATIC_DIR
            },
        },
    }
};
