const functions = require('firebase-functions');
const snoowrap = require('snoowrap');

// Create a new snoowrap requester with OAuth credentials.
// For more information on getting credentials, see here: https://github.com/not-an-aardvark/reddit-oauth-helper
const reddit = new snoowrap({
  userAgent: 'web:Infection Game:v0.0.1 (by /u/call_me_miguel)',
  clientId: functions.config().reddit.auth.client_id,
  clientSecret: functions.config().reddit.auth.client_secret,
  refreshToken: functions.config().reddit.auth.refresh_token
});

// Printing a list of the titles on the front page
exports.test = async function () {
  reddit.getHot().map(post => post.title)
    .then(result => {
      console.log(result);
      return Promise.resolve();
    }).catch(err => {
      console.error(new Error('Failed to complete createUser flow', err));
    });
}