const reddit_util = require('../reddit/reddit_util.js');

exports.handleNewMentionJobs = async function (admin, firestore, mentionDocs) {
  // Don't want to process an id twice in this same block
  let seenMentionIds = new Set();

  const processingPromises = [];
  for (let i = 0; i < mentionDocs.length; i++) {
    let doc = mentionDocs[i];
    let data = doc.data();

    // Only process the uniques
    let mentionId = data.mention_id;
    if (seenMentionIds.has(mentionId)) {
      continue;
    }
    seenMentionIds.add(mentionId);

    // Free to process
    processingPromises.push(handleMentionDoc(admin, firestore, doc));
  }

  // Process everything before deletions
  await Promise.all(processingPromises);

  // TODO Delete the docs! Duplicate mention ids as well
  console.log("Would have deleted here!");

  // Done
  return Promise.resolve();
}

async function handleMentionDoc(admin, firestore, mentionDoc) {
  // Get all the replices to even see if we have to do anything
  const data = mentionDoc.data();
  const allRepliersToMention = reddit_util.getAllRepliersToMention(data.mention_id);

  if (allRepliersToMention.length === 0) {
    // Nothing to do!
    console.log(`mention ${data.context} had no replies :(`);
    return Promise.resolve();
  }

  const zombieUsername = data.author;
  const infectionSubreddit = data.subreddit;
  const infectionContext = data.context;
  // Not precisely when they got infected, but close enough lol
  const infectedAtUtc = data.posted_at_utc;

  // Check if author is infected, if not back out

  // INFECTION RECORD COLLECTION
    // * CREATE document describing the when/where/who of the infection for each individual infection

  // INFECTED COLLECTION
    // * CREATE infection document for each replier, stating when/where/who infected them
    // * UPDATE infector document with the newly infected people
        // https://cloud.google.com/firestore/docs/manage-data/add-data#update_elements_in_an_array
    // * Iterate up infector parents with the number of newly infected

}