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
      // console.log(`Already seen mention id ${mentionId}`);
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

exports.createGenesisInfection = async function (admin, firestore, unsafeRedditorName) {
  // Create a new user with no parents and a special "is genesis" key
  const parentTreeDepth = -1;
  const safeRedditorName = reddit_util.getFirestoreSafeRedditorName(unsafeRedditorName);

  const mentionData = {
    mention_id: "fo9cwo0",
    // Not precisely when they got infected, but close enough lol
    posted_at_utc: new Date() / 1000,
    // No author since this is a genesis user
    // author: safeRedditorName,
    context: "https://www.reddit.com/r/RedditInfectionGame/comments/g6g9e6/genesis/fo9cwo0",
    subreddit: "RedditInfectionGame"
  };

  return await stubbs_manager.createNewStubb(admin, firestore, mentionData, safeRedditorName, parentTreeDepth, true);
}

async function handleMentionDoc(admin, firestore, mentionData) {
  // ALICE the author has bitten BOB
  const aliceName = mentionData.author;

  console.log(`Handling mention doc for data ${mentionData.context}`);
  // Get all the replices to even see if we have to do anything
  const allRepliersToMention = await reddit_util.getAllRepliersToMention(mentionData.mention_id, aliceName);
  console.log(`allRepliersToMention: ${allRepliersToMention}`);

  if (allRepliersToMention.length === 0) {
    // Nothing to do!
    console.log(`mention ${mentionData.context} had no replies :(`);
    return Promise.resolve();
  }

  // Check if author is infected, if not back out
  let aliceDoc = await stubbs_manager.getDocumentForRedditor(admin, firestore, aliceName);
  if (!aliceDoc.exists) {
    console.log(`Author with name ${aliceName} is not infected!`);
    return Promise.resolve();
  }
  const aliceData = aliceDoc.data();

  // Need to sanitize the list of repliers of people already infected
  let sanitizedRepliersList = await stubbs_manager.filterListOfAlreadyInfected(admin, firestore, allRepliersToMention);
  console.log(`sanitizedRepliersList: ${sanitizedRepliersList}`);
  if (sanitizedRepliersList.length === 0) {
    console.log(`All repliers were already infected. Returning.`);
    return Promise.resolve();
  }

  // INFECTION RECORD COLLECTION
    // * CREATE document describing the when/where/who of the infection for each individual infection
  await infection_recorder.createInfectionRecords(admin, firestore, sanitizedRepliersList, mentionData);

  // INFECTED COLLECTION
    // * CREATE infection document for each replier, stating when/where/who infected them
    // * UPDATE infector document with the newly infected people
        // https://cloud.google.com/firestore/docs/manage-data/add-data#update_elements_in_an_array
    // * Iterate up infector parents with the number of newly infected

  // Create the infection doc for each replier
  const aliceDepth = aliceData.tree_depth || 0;
  let stubbCreationPromises = [];
  sanitizedRepliersList.forEach(replier => {
    stubbCreationPromises.push(stubbs_manager.createNewStubb(admin, firestore, mentionData, replier, aliceDepth, false));
  });
  await Promise.all(stubbCreationPromises);

  // Update alice doc
  await stubbs_manager.updateAliceDocWithNovelInfections(admin, firestore, aliceName, sanitizedRepliersList);

  // Set alice flair
  // Should be unchanged
  let aliceIndirectCount = aliceData.num_inf_direct;
  // Since this data is stale, this should be the new number
  let aliceDirectCount = aliceData + sanitizedRepliersList.length;
  await reddit_util.setUserInfectionFlair(aliceName, aliceDirectCount, aliceIndirectCount);

  // Update infector parents up the chain!
  let aliceInfectionParent = aliceData.inf_by;
  await stubbs_manager.traverseParentChainToUpdateIndirectCounts(admin, firestore, aliceName, sanitizedRepliersList.length);

  return Promise.resolve();
}