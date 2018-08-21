const merge = require('webpack-merge');
const serverCommon = require('./webpack.server.common.js');

const server = (env, argv) => merge(serverCommon(env,argv), {
        target: "node",
        devtool: 'source-map',
        output: {
            pathinfo: true
        }
    }
);

module.exports = [server];
