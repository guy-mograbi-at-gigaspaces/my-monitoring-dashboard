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
            full_name: repo.full_name,
            href : repo.html_url,
            requests: [],
            issues: 0
        }
    }
}

function getPullRequests() {

    github.getRateLimit(function(result){
       logger.info('rate limit is',JSON.stringify(result.rate));
    });

    github.getAllRepositories({ignoreForks: true},function (err, repos) {
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
                full_name: repo.full_name,
                href: repo.href,
                requests: repo.requests.length,
                issues: repo.issues - repo.requests.length
            });
        }
    }

    logger.trace('sending data',data);
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
