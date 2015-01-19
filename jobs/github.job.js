var config = require('../config');
var GitHubApi = require("github");
var currentRequests = 0;

var github = new GitHubApi({
    version: "3.0.0",
    timeout: 5000
});

github.authenticate({
    type: "oauth",
    token: config.github.token
});

function updatePullRequests() {
    github.pullRequests.getAll({
        user: 'cloudify-cosmo',
        repo: 'cloudify-ui',
        state: 'open'
    }, function (err, res) {
        var lastRequests = currentRequests;
        currentRequests = res.length;
        send_event('github', {current: currentRequests, last: lastRequests});
    });
}

setInterval(updatePullRequests, config.pullingTime);
updatePullRequests();
