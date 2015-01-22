'use strict';

var config = require('../config');
var jira = require('./modules/jira.module');
var log4js = require('log4js');
var logger = log4js.getLogger('config');
var userIssues = {};

function getIssues(fnCallback) {
    jira.getIssues({
        jql: 'project=CFY and component=UI',
        fields: 'assignee,status',
        maxResults: '1000'
    }, fnCallback);
}

function getUsersIssues(issues, fnCallback) {
    for (var i = 0; i < issues.length || fnCallback(); i++) {
        var issue = issues[i];
        if (issue.fields.assignee !== null) {
            addUserIssue(issue);
        }
    }
}

function addUserIssue(issue) {
    try {
        var userKey = issue.fields.assignee.key;
        var userName = issue.fields.assignee.displayName;
        if (!userIssues.hasOwnProperty(userKey)) {
            userIssues[userKey] = {
                name: userName,
                statuses: {
                    'open': 0,
                    'resolved': 0
                }
            }
        }
        addUserIssueStatus(userKey, issue.fields.status.name.toLowerCase());
    }
    catch (e) {
        logger.info('addUserIssue:error', e, issue);
    }
}

function addUserIssueStatus(userKey, status) {
    if (userIssues[userKey].statuses.hasOwnProperty(status)) {
        userIssues[userKey].statuses[status] += 1;
    }
}

function startJob() {
    userIssues = {};
    getIssues(function (err, issues) {
        getUsersIssues(issues, function () {
            var data = [];
            for (var i in userIssues) {
                data.push(userIssues[i]);
            }
            send_event('jira-issues', {items: data});
        });
    });
}

setInterval(startJob, config.pullingTime);
startJob();