'use strict';

var config = require('../config');
var https = require('https');
var statuses = {
    Open: 0,
    Closed: 0,
    Resolved: 0
};

function getStatusData(fnCallback) {
    https.get(config.jira.apiUrl + '/search?jql=project=CFY%20and%20component=UI&fields=status&maxResults=1000', function (res) {
        var result = '';
        res.on('data', function (chunk) {
            result += chunk;
        });
        res.on('end', function () {
            var obj = JSON.parse(result);
            fnCallback(obj);
        });
    });
}

function addStatusRecord(response, fnCallback) {
    for (var i = 0; i < response.issues.length || fnCallback(); i++) {
        var issue = response.issues[i];
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
    getStatusData(function (response) {
        addStatusRecord(response, function () {
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