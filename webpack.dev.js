const { mergeWithCustomize, customizeObject } = require('webpack-merge');
const clientCommon = require('./webpack.common.js');

// eslint-disable-next-line no-undef
module.exports = (env, argv) => mergeWithCustomize(
    {
        customizeObject: customizeObject({
            entry: 'prepend'
        })
    })(clientCommon(env,argv), {
        devtool: 'eval-cheap-module-source-map',
        optimization: {
            emitOnErrors: false
        }
    }
);
