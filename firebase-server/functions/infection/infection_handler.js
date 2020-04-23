const reddit_util = require('../reddit/reddit_util.js');
const infection_recorder = require('./records.js');
const stubbs_manager = require('./stubbs.js');

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
      console.log(`Already seen mention id ${mentionId}`);
      continue;
    }
    seenMentionIds.add(mentionId);

    // Free to process
    console.log(`Processing mention id ${mentionId}`);
    processingPromises.push(handleMentionDoc(admin, firestore, data));
  }

  // Process everything before deletions
  await Promise.all(processingPromises);

  // TODO Delete the docs! Duplicate mention ids as well
  console.log("Would have deleted here!");

  // Done
  return Promise.resolve();
}

async function handleMentionDoc(admin, firestore, mentionData) {
  // ALICE the author has bitten BOB
  const aliceName = mentionData.author;

  console.log(`Handling mention doc for data ${mentionData.context}`);
  // Get all the replices to even see if we have to do anything
  const allRepliersToMention = await reddit_util.getAllRepliersToMention(mentionData.mention_id, aliceName);

  if (allRepliersToMention.length === 0) {
    // Nothing to do!
    console.log(`mention ${mentionData.context} had no replies :(`);
    return Promise.resolve();
  }

  // Check if author is infected, if not back out
  let aliceDoc = stubbs_manager.getDocumentForRedditor(aliceName);
  if (!aliceDoc.exists) {
    console.log(`Author with name ${aliceName} is not infected!`);
    return;
  }

  // Need to sanitize the list of repliers of people already infected
  sanitizedRepliersList = await stubbs_manager.filterListOfAlreadyInfected(admin, firestore, allRepliersToMention);

  // INFECTION RECORD COLLECTION
    // * CREATE document describing the when/where/who of the infection for each individual infection
  await infection_recorder.createInfectionRecords(admin, firestore, sanitizedRepliersList, mentionData);

  // INFECTED COLLECTION
    // * CREATE infection document for each replier, stating when/where/who infected them
    // * UPDATE infector document with the newly infected people
        // https://cloud.google.com/firestore/docs/manage-data/add-data#update_elements_in_an_array
    // * Iterate up infector parents with the number of newly infected


}