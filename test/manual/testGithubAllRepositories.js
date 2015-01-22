var Github = require('../../jobs/modules/github.module');

var testConf = require('../../dev/test.json');
var _ = require('lodash');
var logger = require('log4js').getLogger('testGithubAllRepositories');

var github = new Github( testConf.github );

github.getAllRepositories( { ignoreForks: true }, function(err, result){
    if ( !!err ){
        logger.error('unable to get repositories',err);
        return;
    }else{
        result = _.compact(result);
        //logger.info(result);
        logger.info('got all repositories', _.map(result, function( item ){ return { 'name' : item.name, 'full_name' : item.full_name } }) );
    }
});