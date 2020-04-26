// ANY redditor username that leaves this module should be escaped!!!
// Repliers, authors, etc. ALL should be safe before exit!

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
  if (mentions.length === 0) {
    return [];
  }
  for (let i = 0; i< mentions.length; i++) {
    let mention = mentions[i];
    mentionParcels.push({
      mention_id: mention.id,
      posted_at_utc: mention.created_utc,
      author: exports.getFirestoreSafeRedditorName(mention.author.name),
      subreddit: mention.subreddit.display_name,
      context: mention.context
    });
  }

  // Mark all the mentions as read
  await reddit.markMessagesAsRead(mentions);
  return mentionParcels;
}

exports.getAllRepliersToMention = async function(mentionId, safeOriginalAuthorName) {
  // Get the comment itself
  let comment = await reddit.getComment(mentionId);

  // https://not-an-aardvark.github.io/snoowrap/Comment.html#expandReplies__anchor
  // The depth is explicitly checked since the Reddit API apparently
  // can return deeper comments than we want
  return comment.expandReplies({ depth: 1 }).replies
    .filter(post => post.depth === 1)
    .filter(post => exports.getFirestoreSafeRedditorName(post.author.name) !== safeOriginalAuthorName)
    .map(post => exports.getFirestoreSafeRedditorName(post.author.name));
}

exports.setUserInfectionFlair = async function (safeFirestoreName, directInfections, indirectInfections) {
  let flairText = `D₀: ${directInfections} Iₙ: ${indirectInfections}`;
  return setUserFlair(safeFirestoreName, flairText);
}

// Just the name in quotes
exports.getFirestoreSafeRedditorName = function(name) {
  return `'${name}'`;
}

exports.getRedditorNameFromFirestore = function(safeFirestoreName) {
  return safeFirestoreName.slice(1, safeFirestoreName.length - 1);
}

async function setUserFlair(safeFirestoreName, flairText) {
  const redditorName = exports.getRedditorNameFromFirestore(safeFirestoreName);
  console.log(`Giving user ${redditorName} flair ${flairText}`);
  return await reddit.getUser(redditorName).assignFlair({ subredditName: 'RedditInfectionGame', text: flairText });
}

async function getAllMentions() {
  // The following doesn't work since they aren't
  // actual inbox messages and can't be marked-as-read/deleted
  // return reddit.getInbox({ filter: "mentions" });

  // Check if it's a mention based on the fields present
  return (await reddit.getUnreadMessages())
    .filter(p => p.was_comment === true && p.type === "username_mention");
}