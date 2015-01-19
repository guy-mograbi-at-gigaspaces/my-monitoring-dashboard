var _ = require('lodash');
var log4js = require('log4js');
var logger = log4js.getLogger('config');
var config = require('./prod.json');
var meConf = null;

try {
    meConf = require('./dev/meConf');
}
catch(e) {
    logger.warn('(optional) meConf.json is missing.');
}

function getConfig() {
    if(meConf !== null) {
        _.merge(config, meConf)
    }
    return config;
}

module.exports = getConfig();