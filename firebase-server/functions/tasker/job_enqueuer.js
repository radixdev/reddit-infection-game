const MINUTES_20_S = 1200;
const MINUTES_60_S = 3600;
const HOURS_4_S = 14400;

const QUEUE_EXPIRATION_OFFSETS = [MINUTES_20_S, MINUTES_60_S, HOURS_4_S];

exports.enqueueMentionsToPendingList = async function (admin, firestore, mentionParcels) {
  const pendingCollection = firestore.collection('pending_mentions');

  const pendingDocumentPromises = [];
  for (let i = 0; i < mentionParcels.length; i++) {
    let mention = mentionParcels[i];
    for (let j = 0; j < QUEUE_EXPIRATION_OFFSETS.length; j++) {
      pendingDocumentPromises.push(pendingCollection.add(createPendingDocument(admin, mention, QUEUE_EXPIRATION_OFFSETS[j])));
    }
  }

  return await Promise.all(pendingDocumentPromises);
}

function createPendingDocument(admin, mention, postedTimeDeltaSeconds) {
  return {
    mention_id: mention.mention_id,
    posted_at_utc: mention.posted_at_utc,
    author: mention.author,
    context: mention.context,

    // Fields for Firestore itself
    processed_at: admin.firestore.FieldValue.serverTimestamp(),
    queue_expiration_at_utc: mention.posted_at_utc + postedTimeDeltaSeconds
  };
}