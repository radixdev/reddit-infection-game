const reddit_util = require('../reddit/reddit_util.js');

exports.createGenesisStubb = async function(admin, firestore, unsafeRedditorUsername) {
  // Create a new user with no parents and a special "is genesis" key
}

exports.createNewStubb = async function(admin, firestore, mentionData, safeReplierName, parentTreeDepth) {
  // Create a new user with links to the mentioner
  const stubbsCollection = firestore.collection('stubbs');
  let stubbsDocWrite = stubbsCollection.doc(safeReplierName).set({
    processed_at: admin.firestore.FieldValue.serverTimestamp(),

    inf_by: mentionData.author,
    inf_at: new Date(mentionData.posted_at_utc * 1000),
    inf_context: mentionData.context,
    inf_sub: mentionData.subreddit,
    inf_mention_id: mentionData.mention_id,

    // Downstream infections, including direct infections
    num_inf_indirect: 0,

    // Direct infections. Size of the infected_list
    num_inf_direct: 0,
    inf_list: [],

    // How many parents exist until genesis
    tree_depth: parentTreeDepth + 1
  });

  // Collection of only the names
  const stubbsNamesCollection = firestore.collection('stubbs_names');
  let stubbsLookupDocWrite = stubbsNamesCollection.doc(safeReplierName).set({
    name: safeReplierName
  });

  return Promise.all([stub])
}

exports.isRedditorAlreadyInfected = async function (admin, firestore, safeRedditorName) {
  const stubbsLookupCollection = firestore.collection('stubbs_names');
  let doc = await stubbsCollection.doc(safeRedditorName).get();
  return doc.exists;
}

exports.getDocumentForRedditor = async function(admin, firestore, safeRedditorName) {
  const stubbsCollection = firestore.collection('stubbs');
  return await stubbsCollection.doc(safeRedditorName).get();
}