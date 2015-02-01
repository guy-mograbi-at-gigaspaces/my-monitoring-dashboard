/**
 * Created by liron on 2/1/15.
 */
'use strict';

var listallmachines = require('list-all-machines');
var logger = require('log4js').getLogger('list-all-machines.module');
var config = require('../config');
var path = require('path');


function startJob() {
    try {
        logger.trace('starting the list-all-machines job');


        var listAllMachinesConf = require(path.resolve(config.listAllMachines.filePath) );

        logger.trace('list all machines configuration is', listAllMachinesConf);

        listallmachines.list(listAllMachinesConf, function callback(err, result) {

            logger.trace('current config file path ' + config.listAllMachines.filePath);

            if (!!err) {
                logger.error('error getting list-all-machines result.');
            }

            logger.trace('list all machine result: ' + JSON.stringify(result));
            logger.trace('total machines up ' + result.total);

            logger.trace('alerting the dashboard of list-all-machines ', result.total );

            send_event('totalMachines', {current: result.total});

        });


    }catch(e){
        logger.error('list all machines failed',e);
    }

}

try{
    logger.trace('setting interval on list-all-machines with ', config.listAllMachines.interval );
    setInterval(startJob, config.listAllMachines.interval);
    startJob();
}catch(e){
    console.log('error while setting list all machines', e);
}



