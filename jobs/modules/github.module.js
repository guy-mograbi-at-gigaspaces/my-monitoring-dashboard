var GitHubApi = require("github");
var config = require('../../config');
var _ = require('lodash');


function Github() {

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
        token: config.github.token
    });

    function getReposByUser( user, fnCallback ) {
        github.repos.getFromUser({ user: user }, function(err, res){
            fnCallback(err, res);
        });
    }

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
     * @param repos List of repositories under the schema, for example:
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

    this.getReposByUser = getReposByUser;
    this.getRepo = getRepo;
    this.getPullRequests = getPullRequests;
    this.getIssues = getIssues;
}


module.exports = new Github;