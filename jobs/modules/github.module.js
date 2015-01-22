'use strict';

var GitHubApi = require("github");

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
        github.repos.getFromUser({ user: config.user },  fnCallback );
    }

    function getReposByOrganization( organization , callback ){
        github.repos.getFromOrg({org: organization}, callback);
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
                        logger.debug('got repositories for user');
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
                }


            ], function(err){
                if ( !!err ){
                    logger.error('unable to get repositories', err);

                }
                // ignore or don't ignore forks
                if ( !!opts.ignoreForks ){
                    result = _.filter(result, {'fork' : false });
                }

                callback(err, result);
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
     *      user: 'cloudify-cosmo',
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
}

module.exports = Github;
