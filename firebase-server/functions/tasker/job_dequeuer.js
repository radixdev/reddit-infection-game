exports.dequeueExpiredMentionsFromPending = async function (admin, firestore) {
  const nowUtcSeconds = Date.now() / 1000;
  const pendingCollection = firestore.collection('pending_mentions');

  let expiredDocumentsSnapshot = await pendingCollection
    .where('queue_expiration_at_utc', '<=', nowUtcSeconds)
    .limit(25)
    .get();

  if (expiredDocumentsSnapshot.empty) {
    console.log("No documents have expired. Returning empty list.");
    return [];
  }

  let mentionsForProcessing = [];
  expiredDocumentsSnapshot.forEach(doc => {
    mentionsForProcessing.push(doc);
  })

  return mentionsForProcessing;
}