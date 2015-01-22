'use strict';

var config = require('../config');
var jira = require('./modules/jira.module');
var statuses = {
    Open: 0,
    Closed: 0,
    Resolved: 0
};

function getStatusData(fnCallback) {
    jira.getIssues({
        jql: 'project=CFY and component=UI',
        fields: 'assignee,status',
        maxResults: '1000'
    }, fnCallback);
}

function addStatusRecord(issues, fnCallback) {
    for (var i = 0; i < issues.length || fnCallback(); i++) {
        var issue = issues[i];
        if (issue.fields.status !== null) {
            countStatus(issue.fields.status.name);
        }
    }
}

function countStatus(status) {
    if (statuses.hasOwnProperty(status)) {
        statuses[status] += 1;
    }
}

function startJob() {
    getStatusData(function (err, issues) {
        addStatusRecord(issues, function () {
            var data = [];
            for (var status in statuses) {
                data.push({
                    label: status,
                    value: statuses[status]
                });
            }
            send_event('jira-status-pie', {value: data})
        });
    });
}

setInterval(startJob, config.pullingTime);
startJob();