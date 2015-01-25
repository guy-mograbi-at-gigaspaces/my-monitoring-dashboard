'use strict';

var GitHubApi = require("github");
var request = require('request');

var _ = require('lodash');
var async = require('async');
var logger = require('log4js').getLogger('github.module');

function Github( config ) {

    /**
     * Initialize Github
     * @type {GitHubApi}
     */
    var github = new GitHubApi({
        version: "3.0.0",
        timeout: 5000
    });

    /**
     * OAuth2
     */
    github.authenticate({
        type: "oauth",
        token: config.token
    });

    /**
     * getReposByUser
     * @description - get repositories by owner login name
     * @param user - owner login name
     * @param fnCallback - Callback function
     */
    function getReposByUser(  fnCallback ) {
        logger.debug('getting repositories per user');
        github.repos.getFromUser({ user: config.user , per_page: 100},  fnCallback );
    }

    function getReposByOrganization( organization , callback ){
        github.repos.getFromOrg({org: organization, per_page:100}, callback);
    }

    function getRateLimit( callback ){
        request.get( { 'url' : 'https://' + config.token + ':x-oauth-basic@api.github.com/rate_limit', 'headers' : { 'User-Agent': 'guy-mograbi-at-gigaspaces'}}, function( err, response, body ){
            if ( !!err ){
                logger.error('unable to get rate limit',err);
            }

            if ( typeof(body) === 'string'){
                try {
                    body = JSON.parse(body);
                }catch(e){
                    logger.error('unable to parse', body, e);
                }
            }
            body.rate.timeLeft =  Math.floor(( body.rate.reset - ( new Date().getTime()/1000 ) ) / 60) + 'min';
            callback(body);
        });
    }

    /**
     * @description
     * filters by "include" or "exclude" fields
     * @param repos
     * @returns {*}
     */
    function filterRepos( repos ){
        if (config.hasOwnProperty('excludeRepos') && config.excludeRepos.length > 0) {
            logger.trace('filtering by exclude');
            repos = _.filter(repos, function (repo) {

                if ( repo.name.toLowerCase() === 'cloudify'){
                    console.log('processing cloudify');
                }
                var result = !_.find(config.excludeRepos, function(exclude){
                    return !!repo.full_name.match(new RegExp(exclude,'i')) || !!repo.name.match(new RegExp(exclude,'i'));
                });
                logger.trace('should i show ', repo.name, '?', result);
                return result;
            });
        }

        logger.trace('after excluding', repos.length);


        //if ( config.hasOwnProperty('includeRepos') && config.includeRepos.length > 0 ){
        //    logger.trace('filtering by include');
        //    repos = _.filter(repos, function(repo){
        //        return !!_.find(config.includeRepos, function(include){
        //            return !repo.full_name.match(new RegExp(include,'i'));
        //        })
        //    })
        //}

        return repos;
    }

    function resolveForks(repos, callback) {
        var reposList = [];
        // lets handle forks. if fork, we must get upstream for real information
        async.each(repos,

            /**
             *
             * @description
             * this function handles one repository, checks if fork, if fork it fetches upstream
             *
             * @param repo a specific repository we want to handle
             * @param callback - called when finished working on this specific repository
             */
            function handleRepo(repo, callback) { // for each repository

                //logger.trace('processing', repo.name);
                if (repo.fork) { // if fork get upstream
                    github.getRepo(repo.owner.login, repo.name, function (err, repoFork) {

                        if (!!err) {
                            logger.error('unable to fetch upstream', err);
                        }
                        reposList.push(repoFork.source);
                        callback();
                    });
                } else { // if not fork, no need for processing
                    reposList.push(repo);
                    callback();
                }
            }, function allDone(err) { // when we are done processing forks..
                logger.debug('finished processing repos');
                if (!!err) {
                    logger.error('unable to handle forks', err);
                }
                callback(err, reposList);
            });
    }


    /**
     * Gets repositories from user and from user's organizations and appends them all together.
     * @param callback
     * @param {object} opts
     * @param {boolean} [opts.ignoreForks=true] to ignore forks or not
     */
    function getAllRepositories(  opts, callback ){

        logger.debug('getting all repositories');
        var result = [];


        async.waterfall(
            [
                function getForUser( callback ){ // gets repositories from user
                    getReposByUser(  function(err, repos){
                        if ( !!err ){
                            callback(err);
                            return;
                        }
                        logger.debug('got repositories for user', repos.length);
                        result = result.concat(repos);
                        callback();
                    });
                },
                function getOrganizations( callback ){ //get organizations
                    logger.debug('getting organizations');
                    // get all organization
                    github.user.getOrgs( { user: config.user }, function( err, orgs ){
                        if ( !!err ){
                            callback(err);
                            return;
                        }
                        //logger.debug('got orgs', orgs);
                        async.each(orgs, function( item, callback ){ // for each organization, get repositories
                            getReposByOrganization( item.login, function( err, repos ){
                                if ( !!err ){
                                    callback(err);
                                    return;
                                }
                                result = result.concat( repos );
                                callback();
                            } );
                        }, function allDone( err ){
                            callback(err);
                        })

                    });
                },
                function processResult( callback ){

                    // ignore or don't ignore forks
                    if ( !!opts.ignoreForks ){
                        result = _.filter(result, {'fork' : false });
                    }

                    result = filterRepos(result);
                    resolveForks(result, function( err, repos){
                        logger.info('after resolving fork', repos.length);
                        result = _.sortBy(repos,  function (i) { return i.name.toLowerCase(); });

                        callback();
                    });
                }


            ], function(err){
                logger.trace('finished collecting github data', result.length );
                if ( !!err ){
                    logger.error('unable to get repositories', err);

                }

                callback(err,result);


            }
        )
    }

    /**
     * getRepo
     * @description - get single repository with full data
     * @param user - owner login name
     * @param repo - repository name
     * @param fnCallback - Callback function
     */
    function getRepo( user, repo, fnCallback ) {
        github.repos.get({
            user: user,
            repo: repo
        }, function(err, res){
            fnCallback(err, res);
        });
    }

    /**
     * getPullRequests
     * @param repos - List of repositories under the schema, for example:
     * {
     *      user: 'cloudify-cosmo',
     *      repo: 'cloudify-ui',
     *      state: 'open'
     * }
     * @param fnCallback Callback function
     */
    function getPullRequests( repos, fnCallback ) {
        if(!_.isArray(repos)) {
            fnCallback(true, {
                "error": "Please provide List of repositories"
            });
        }

        var chunks = [];
        for(var i = 0; i < repos.length; i++) {
            (function(repo) {
                github.pullRequests.getAll(repo, function (err, res) {
                    chunks.push({
                        name: repo.repo,
                        requests: res
                    });

                    if(chunks.length === repos.length) {
                        fnCallback(null, chunks);
                    }
                });
            })(repos[i]);
        }
    }

    /**
     * getIssues
     * @param repos List of repositories under the schema, for example:
     * {
     *      user: 'cloudify-cosmo',7
     *      repo: 'cloudify-ui',
     *      state: 'open'
     * }
     * @param fnCallback Callback function
     */
    function getIssues( repos, fnCallback ) {
        if(!_.isArray(repos)) {
            fnCallback(true, {
                "error": "Please provide List of repositories"
            });
        }

        var chunks = [];
        for(var i = 0; i < repos.length; i++) {
            (function(repo) {
                github.issues.repoIssues(repo, function (err, res) {
                    chunks.push({
                        name: repo.repo,
                        issues: res
                    });

                    if(chunks.length === repos.length) {
                        fnCallback(null, chunks);
                    }
                });
            })(repos[i]);
        }
    }

    // Class Methods Index
    this.getReposByUser = getReposByUser;
    this.getRepo = getRepo;
    this.getPullRequests = getPullRequests;
    this.getIssues = getIssues;
    this.getAllRepositories = getAllRepositories;
    this.getRateLimit = getRateLimit;
}

module.exports = Github;
