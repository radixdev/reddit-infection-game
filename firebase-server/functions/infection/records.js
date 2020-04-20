exports.createInfectionRecords = async function (admin, firestore, mondayUsernames, data) {
  const infectionRecordCollection = firestore.collection('infection_records');

  const pendingDocumentPromises = [];
  for (let i = 0; i < mondayUsernames.length; i++) {
    let mondayUsername = mondayUsernames[i];
    let recordDoc = infectionRecordCollection.add({
      infected_by: data.author,
      newly_infected: mondayUsername,
      infected_in_subreddit: data.subreddit,
      infection_context: data.context,
      infected_at_utc: data.posted_at_utc,

      fs_created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    pendingDocumentPromises.push(recordDoc);
  }

  return await Promise.all(pendingDocumentPromises);
}