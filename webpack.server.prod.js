const merge = require('webpack-merge');
const serverCommon = require('./webpack.server.common.js');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const server = (env, argv) => merge(serverCommon(env,argv), {
        target: "node",
        devtool: 'source-map',
        output: {
            pathinfo: true
        },
        plugins: [
            new UglifyJsPlugin({sourceMap:true}),
        ],
    }
);

module.exports = [server];
