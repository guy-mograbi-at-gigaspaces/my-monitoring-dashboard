var _ = require('lodash');
var meConf = null;

try {
    meConf = require('./meConf');
}
catch(e) {
    console.warn('(optional) meConf.json is missing.');
}

// Default Configuration
var config = {
    pullingTime: 1000 * 60 * 10,
    jira: {
        apiUrl: ''
    }
};

function getConfig() {
    if(meConf !== null) {
        _.merge(config, meConf)
    }
    return config;
}

module.exports = getConfig();