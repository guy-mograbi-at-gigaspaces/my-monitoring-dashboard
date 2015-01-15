'use strict';

var https = require('https');
var userIssues = {};

function getIssues(fnCallback) {
    https.get('https://cloudifysource.atlassian.net/rest/api/latest/search?jql=project=CFY%20and%20component=UI&fields=assignee,status&maxResults=1000', function(res){
        var result = '';
        res.on('data', function(chunk) {
            result += chunk;
        });
        res.on('end', function() {
            var obj = JSON.parse(result);
            fnCallback(obj);
        });
    });
}

function getUsersIssues(response, fnCallback) {
    for (var i = 0; i < response.issues.length || fnCallback(); i++) {
        var issue = response.issues[i];
        if (issue.fields.assignee !== null) {
            addUserIssue(issue);
        }
    }
}

function addUserIssue(issue) {
    try {
        var userKey = issue.fields.assignee.key;
        var userName = issue.fields.assignee.displayName;
        if(!userIssues.hasOwnProperty(userKey)) {
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
    catch(e) {
        console.log('addUserIssue:error', e, issue);
    }
}

function addUserIssueStatus(userKey, status) {
    if(userIssues[userKey].statuses.hasOwnProperty(status)) {
        userIssues[userKey].statuses[status] += 1;
    }
}

getIssues(function(response){
    getUsersIssues(response, function(){
        var data = [];
        for (var i in userIssues) {
            data.push(userIssues[i]);
        }
        send_event('jira-issues', { items: data });
    });
});


//var jiraUsers = [
//    {
//        name: 'Itsik',
//        statuses: {
//            'open': 15,
//            'resolved': 23
//        }
//    },
//    {
//        name: 'Guy',
//        statuses: {
//            'open': 63,
//            'resolved': 101
//        }
//    },
//    {
//        name: 'Erez',
//        statuses: {
//            'open': 18,
//            'resolved': 32
//        }
//    }
//];
//send_event('jira', { items: jiraUsers });