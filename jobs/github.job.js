var config = require('../config');
var github = require('./modules/github.module');
var _ = require('lodash');

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
    github.getReposByUser(config.github.user, function (err, repos) {
        var reposList = [];

        if(config.github.hasOwnProperty('excludeRepos') && config.github.excludeRepos.length > 0) {
            repos = _.remove(repos, function(repo) {
                return config.github.excludeRepos.indexOf(repo.name) === -1;
            });
        }

        for (var i = 0; i < repos.length; i++) {
            var repo = repos[i];

            if (repo.fork) {
                github.getRepo(repo.owner.login, repo.name, function (err, repoFork) {
                    reposList.push(repoFork.source);

                    if (reposList.length == repos.length) {
                        fnCallback(null, reposList);
                    }
                });
            } else {
                reposList.push(repo);
            }
        }
    });
}

function getPullRequests() {
    getAllRepos(function (err, repos) {
        initRepositoriesData(repos, function () {
            var repoQuerys = [];
            for (var i in repos) {
                var repo = repos[i];

                repoQuerys.push({
                    user: repo.owner.login,
                    repo: repo.name,
                    state: 'open'
                });

                repositories[repo.name].issues = repo.open_issues;
            }

            github.getPullRequests(repoQuerys, function (err, reposRequests) {
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
