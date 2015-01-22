var config = require('../config');
var Github = require('./modules/github.module');
var _ = require('lodash');
var async = require('async');
var logger = require('log4js').getLogger('github.job');
logger.trace('github conf is', config.github);
var github = new Github(config.github); // todo: support multiple configurations

var repositories = {};
var totalRequests = 0;
var lastTotalRequests = 0;
var totalIssues = 0;
var lastTotalIssues = 0;

function initRepositoriesData(repos, fnCallback) {
    for (var i = 0; i < repos.length || fnCallback(); i++) {
        var repo = repos[i];
        repositories[repo.name] = {
            requests: [],
            issues: 0
        }
    }
}

function getAllRepos(fnCallback) {
    github.getAllRepositories({ignoreForks: true}, function (err, repos) {
        try {
            var reposList = [];

            logger.debug('got repos');
            if (config.github.hasOwnProperty('excludeRepos') && config.github.excludeRepos.length > 0) {
                repos = _.remove(repos, function (repo) {
                    return config.github.excludeRepos.indexOf(repo.name) === -1;
                });
            }

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

                    logger.trace('processing', repo.name);
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
                    fnCallback(err, reposList);
                });
        }catch(e){
            logger.error('unable to perform job',e);
        }
    });
}

function getPullRequests() {
    getAllRepos(function (err, repos) {
        initRepositoriesData(repos, function () {
            var repoQueries = [];

            for (var i in repos) {
                var repo = repos[i];

                repoQueries.push({
                    user: repo.owner.login,
                    repo: repo.name,
                    state: 'open'
                });

                repositories[repo.name].issues = repo.open_issues;
            }

            github.getPullRequests(repoQueries, function (err, reposRequests) {
                for (var i = 0; i < reposRequests.length || taskComplete(); i++) {
                    var repo = reposRequests[i];
                    repositories[repo.name].requests = repo.requests;
                }
            });
        });
    });
}

function taskComplete() {
    sendPullRequestsEvent();
    sendTotalRequestsEvent();
    sendTotalIssuesEvent();
}

function sendPullRequestsEvent() {
    var data = [];

    for (var name in repositories) {
        var repo = repositories[name];

        if (repo.issues > 0) {
            data.push({
                name: name,
                requests: repo.requests.length,
                issues: repo.issues - repo.requests.length
            });
        }
    }

    send_event('github_pull_requests', {items: data});
}

function sendTotalRequestsEvent() {
    lastTotalRequests = totalRequests;
    totalRequests = 0;

    for (var i in repositories) {
        var repo = repositories[i];
        totalRequests += repo.requests.length;
    }

    send_event('github_total_requests', {
        current: totalRequests,
        last: lastTotalRequests
    });
}

function sendTotalIssuesEvent() {
    lastTotalIssues = totalIssues;
    totalIssues = 0;

    for (var i in repositories) {
        var repo = repositories[i];
        totalIssues += repo.issues;
    }

    send_event('github_total_issues', {
        current: totalIssues,
        last: lastTotalIssues
    });
}

setInterval(getPullRequests, config.pullingTime);
getPullRequests();
