const merge = require('webpack-merge');
const clientCommon = require('./webpack.common.js');

module.exports = (env, argv) => merge.strategy(
    {
        entry: 'prepend'
    })(clientCommon(env,argv), {
        devtool: 'source-map',
        optimization: {
            noEmitOnErrors: true
        }
    }
);
