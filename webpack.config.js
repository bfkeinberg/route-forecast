var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'src/static/scripts/js');
var APP_DIR = path.resolve(__dirname, 'src/static/scripts/jsx');

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
                loader: "babel",
                exclude: /node_modules/,
            },
            { test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader' },
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.(png|woff2?)$/, loader: "url-loader?limit=100000" },
            { test: /\.jpg$/, loader: "file-loader" },
            { test: /\.(ttf|eot|svg)$/, loader: "file-loader" }
        ]
    },
    output: {
        path: BUILD_DIR,
        filename: "main.js",
    },
    resolve: {
        extensions: ['', '.js', '.jsx', '.ts', '.tsx']
    },
    externals: {
        jquery: 'jQuery',
        react: 'React',
        "react-dom": "ReactDOM"
    }
}