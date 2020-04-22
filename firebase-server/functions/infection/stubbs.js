const reddit_util = require('../reddit/reddit_util.js');

exports.createGenesisStubb(admin, firestore, unsafeRedditorUsername) {
  // Create a new user with no parents and a special "is genesis" key
}

exports.createNewMonday(admin, firestore, mentionData, safeReplierName) {
  // Create a new user with links to the mentioner
}

exports.getDocumentForRedditor(admin, firestore, safeRedditorName) {
  // Return the document or null if they don't exist
  // Returning a boolean would waste the actual returned object
}