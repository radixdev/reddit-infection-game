exports.enqueueMentionsToPendingList = async function (admin, firestore, mentionParcels) {
  const pendingCollection = firestore.collection('pending_mentions');

  const pendingDocumentPromises = [];
  for (let i = 0; i < mentionParcels.length; i++) {
    let mention = mentionParcels[i];
    pendingDocumentPromises.push(pendingCollection.add({
      mention_id: mention.mention_id,
      posted_at_utc: mention.posted_at_utc,
      author: mention.author,
      context: mention.context,

      // Fields for Firestore itself
      processed_at: admin.firestore.FieldValue.serverTimestamp()
    }));
  }

  return await Promise.all(pendingDocumentPromises);
}