var config = require('../config');
var GitHubApi = require("github");
var currentRequests = 0;

var github = new GitHubApi({
    version: "3.0.0",
    timeout: 5000
});

github.authenticate({
    type: "oauth",
    token: "24e94f3392033aacff89e26ebc9c5b670d0083c9"
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
