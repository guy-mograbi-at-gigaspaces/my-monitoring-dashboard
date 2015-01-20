var config = require('../config');
var github = require('./modules/github.module');

var repos = [
    {
        user: 'CloudifySource',
        repo: 'cloudify-widget',
        state: 'open'
    },
    {
        user: 'cloudify-cosmo',
        repo: 'cloudify-ui',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'my-monitoring-dashboard',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'qa-project',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify-widget-angular-controller',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify-widget-pages',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify-installer',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'list-all-machines',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'vagrant-automation-machines',
        state: 'open'
    },
    {
        user: 'CloudifySource',
        repo: 'cloudify-widget-modules',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify3-plugins',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'gs-sublime-plugins',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'gs-ui-ks',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'jekyll-project-vagrant-automation',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'gs-ui-infra',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'getcloudify-widget-selenium-tests',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify-ui-selenium-tests-nodejs',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify-widget-angular',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'gs-webui-test-beans',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify-widget-cloud-providers',
        state: 'open'
    },
    {
        user: 'cloudify-cosmo',
        repo: 'getcloudify.org',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cosmo-selenium-tests',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'gs-ui-automation-tools',
        state: 'open'
    },
    {
        user: 'CloudifySource',
        repo: 'cloudify-widget-ui',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'selenium-drivers',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'xap-ui-backend',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify-widget-mock',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'gs-ui-backend',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'gs-ui-build-utils',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify-widget-ibm-client',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'gs-webui-cloudify-tests',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'cloudify-widget-hp-client',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'gs-cloudify-widget-tests',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'landing-page',
        state: 'open'
    },
    {
        user: 'guy-mograbi-at-gigaspaces',
        repo: 'widget-cloud-drivers',
        state: 'open'
    },
    {
        user: 'CloudifySource',
        repo: 'cloudify',
        state: 'open'
    },
    {
        user: 'CloudifySource',
        repo: 'cloudify-recipes',
        state: 'open'
    }
];
var repositories = {};
var tasksComplete = 0;
var totalRequests = 0;
var lastTotalRequests = 0;
var totalIssues = 0;
var lastTotalIssues = 0;

function initRepositoriesData( fnCallback ) {
    for(var i = 0; i < repos.length || fnCallback(); i++) {
        var repo = repos[i];
        repositories[repo.repo] = {
            requests: [],
            issues: []
        }
    }
}

function getPullRequests() {
    initRepositoriesData(function(){
        github.getPullRequests(repos, function (err, reposRequests) {
            for(var i = 0; i < reposRequests.length || taskComplete(); i++) {
                var repo = reposRequests[i];
                repositories[repo.name].requests = repo.requests;
            }
        });

        github.getIssues(repos, function(err, reposIssues){
            for(var i = 0; i < reposIssues.length || taskComplete(); i++) {
                var repo = reposIssues[i];
                repositories[repo.name].issues = repo.issues;
            }
        });
    });
}

function taskComplete() {
    tasksComplete++;
    if(tasksComplete === 2) {
        sendPullRequestsEvent();
        sendTotalRequestsEvent();
        sendTotalIssuesEvent();
    }
}

function sendPullRequestsEvent() {
    var data = [];

    for(var name in repositories) {
        var repo = repositories[name];

        if((repo.requests.length + repo.issues.length) > 0) {
            data.push({
                name: name,
                requests: repo.requests.length,
                issues: repo.issues.length
            });
        }
    }

    send_event('github_pull_requests', { items: data });
}

function sendTotalRequestsEvent() {
    lastTotalRequests = totalRequests;
    totalRequests = 0;

    for(var i in repositories) {
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

    for(var i in repositories) {
        var repo = repositories[i];
        totalIssues += repo.issues.length;
    }

    send_event('github_total_issues', {
        current: totalIssues,
        last: lastTotalIssues
    });
}

setInterval(getPullRequests, config.pullingTime);
getPullRequests();
