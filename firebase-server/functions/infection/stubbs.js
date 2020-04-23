const reddit_util = require('../reddit/reddit_util.js');

exports.createGenesisStubb = async function(admin, firestore, unsafeRedditorUsername) {
  // Create a new user with no parents and a special "is genesis" key
}

exports.createNewStubb = async function (admin, firestore, mentionData, safeRedditorName, parentTreeDepth) {
  console.log(`Creating stubb doc for ${safeRedditorName} with parent tree depth ${parentTreeDepth}`);
  let batch = firestore.batch();

  // Create a new user with links to the mentioner
  let stubbsCreateRef = firestore.collection('stubbs').doc(safeRedditorName);
  batch.set(stubbsRef, {
    // Server field updates count as another write so fuck that
    processed_at: new Date(),

    inf_by: mentionData.author,
    inf_at: new Date(mentionData.posted_at_utc * 1000),
    inf_context: mentionData.context,
    inf_sub: mentionData.subreddit,
    inf_mention_id: mentionData.mention_id,

    // Downstream infections, not including direct infections
    num_inf_indirect: 0,

    // Direct infections. Size of the infected_list
    num_inf_direct: 0,
    inf_list: [],

    // How many parents exist until genesis
    tree_depth: parentTreeDepth + 1
  });

  // Collection of only the names as a lower cost lookup
  let stubbsLookupCreateRef = firestore.collection('stubbs_names').doc(safeRedditorName);
  batch.set(stubbsLookupCreateRef, { name: safeRedditorName} );

  // All done
  return batch.commit();
}

exports.updateAliceDocWithNovelInfections = async function (admin, firestore, safeAliceName, safeNewlyInfectedNamesList) {
  let aliceRef = firestore.collection('stubbs').doc(safeAliceName);

  const numNewInfected = safeNewlyInfectedNamesList.length;
  return await aliceRef.update({
    num_inf_direct: firestore.FieldValue.increment(numNewInfected),
    inf_list: firestore.FieldValue.arrayUnion(safeNewlyInfectedNamesList)
  });
}

exports.isRedditorAlreadyInfected = async function (admin, firestore, safeRedditorName) {
  const stubbsLookupCollection = firestore.collection('stubbs_names');
  let doc = await stubbsCollection.doc(safeRedditorName).get();
  return {
    name: safeRedditorName,
    is_already_infected: doc.exists
  }
}

exports.getDocumentForRedditor = async function(admin, firestore, safeRedditorName) {
  const stubbsCollection = firestore.collection('stubbs');
  return await stubbsCollection.doc(safeRedditorName).get();
}

exports.filterListOfAlreadyInfected = async function (admin, firestore, safeRedditorNameList) {
  // list = [A, B, C]
  // infected = [A, B]
  // return [C]

  let infectionStatusPromises = [];
  for (let i = 0; i < safeRedditorNameList.length; i++) {
    let safeRedditorName = safeRedditorNameList[i];
    infectionStatusPromises.push(isRedditorAlreadyInfected(admin, firestore, safeRedditorName));
  }

  let promiseStatuses = Promise.all(infectionStatusPromises);
  sanitizedList = [];
  for (let i = 0; i < promiseStatuses.length; i++) {
    let promiseStatus = promiseStatuses[i];
    if (!promiseStatus.is_already_infected) {
      sanitizedList.push(promiseStatus.name);
    }
  }

  return sanitizedList;
}
