const merge = require('webpack-merge');
const common = require('./webpack.common.js');
var webpack = require('webpack');

module.exports = merge(common, {
        plugins: [
            new webpack.LoaderOptionsPlugin({
                debug: true
            })
        ],
        output: {
            pathinfo:true
        },
        devtool: 'eval-source-map'
    }
);
