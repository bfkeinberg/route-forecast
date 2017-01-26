var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'src/static/scripts/js');
var APP_DIR = path.resolve(__dirname, 'src/static/scripts/jsx');
var GPX_DIR = path.resolve(__dirname, 'node_modules/gpx-parse/dist');

module.exports = {
    debug: true,
    devtool: 'eval-source-map',

    entry: [
        APP_DIR + '/main.js'
    ],
    module: {
        loaders: [
            {test: /\.jsx?$/,
                include: APP_DIR,
                exclude: /node_modules/,
                loader: "babel"
            },
            { test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader' },
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.(png|woff2?)$/, loader: "url-loader?limit=100000" },
            { test: /\.jpg$/, loader: "file-loader" },
            { test: /\.(ttf|eot|svg)$/, loader: "file-loader" },
            { test: /\.json$/, loader: "json-loader"}
        ]
    },
    output: {
        path: BUILD_DIR,
        filename: "bundle.js",
    },
    resolve: {
        extensions: ['', '.js', '.jsx', '.ts', '.tsx'],
        modulesDirectories: ["web_modules", "node_modules",'node_modules/gpx-parse/dist']
    },
    externals: {
        jquery: 'jQuery'
        // react: 'React',
        // "react-dom": "ReactDOM"
    }
}