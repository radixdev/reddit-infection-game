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

// Everything needed to convert the outstanding
// mentions inbox into database objects for future review
exports.getAllMentionParcels = async function() {
  let mentionParcels = [];
  let mentions = await getAllMentions();
  for (let i = 0; i< mentions.length; i++) {
    let mention = mentions[i];
    mentionParcels.push({
      mention_id: mention.id,
      posted_at_utc: mention.created_utc,
      author: mention.author.name,
      // Can drop this field at a later date?
      context: mention.context
    });
  }
  return mentionParcels;
}

async function getAllMentions() {
  return reddit.getUnreadMessages({ filter: "mentions" });
  // return reddit.getInbox({ filter: "mentions" });
}

async function getAllRepliersToMention(mention) {
  // Get the comment itself
  let comment = await reddit.getComment(mention.id);
  // https://not-an-aardvark.github.io/snoowrap/Comment.html#expandReplies__anchor
  // The depth is explicitly checked since the Reddit API apparently
  // can return deeper comments than we want
  return comment.expandReplies({depth: 1}).replies
    .filter(post => post.depth === 1)
    .map(post => getFirestoreSafeRedditorName(post.author.name));
}

// Just the name in quotes
function getFirestoreSafeRedditorName(name) {
  return `'${name}'`;
}

// Printing a list of the titles on the front page
exports.test = async function () {
  // reddit.getHot().map(post => post.title)
  return getAllMentions()
    .then(result => {
      console.log(result);
      return getAllRepliersToMention(result[0]);
    }).then(result => {
      console.log(result);
      return Promise.resolve();
    }).catch(err => {
      console.error(new Error('Failed to complete createUser flow', err));
    });
}
