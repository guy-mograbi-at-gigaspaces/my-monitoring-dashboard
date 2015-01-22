'use strict';

var config = require('../../config');
var https = require('https');
var querystring = require('querystring');
var _ = require('lodash');

function Jira() {

    function api( object, options, fnCallback ) {
        var fullPath = config.jira.apiUrl + object;

        if(options) {
            fullPath += '?' + querystring.unescape(querystring.stringify(options));
        }

        https.get(fullPath, function (res) {
            var result = '';
            res.on('data', function (chunk) {
                result += chunk;
            });

            res.on('end', function () {
                var obj = JSON.parse(result);
                fnCallback(null, obj)
            });
        });
    }

    function getIssues(options, fnCallback) {
        api('/search', options, function(err, res){
            if(config.jira.hasOwnProperty('execludeAssignees') && config.jira.execludeAssignees.length > 0) {
                res.issues = _.remove(res.issues, function(issue) {
                    if(issue.fields.assignee !== null) {
                        return config.jira.execludeAssignees.indexOf(issue.fields.assignee.displayName) === -1;
                    }
                    return false;
                });
            }

            fnCallback(null, res.issues);
        });
    }

    this.api = api;
    this.getIssues = getIssues;
}

module.exports = new Jira;
