'use strict';

const functions = require('firebase-functions');
var admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(require("./service-account.json")),
  databaseURL: "https://reddit-infection-game.firebaseio.com"
});

const firestore = admin.firestore();
firestore.settings({ timestampsInSnapshots: true });

const reddit_util = require('./reddit/reddit_util.js');
const job_enqueuer = require('./tasker/job_enqueuer.js');
const job_dequeuer = require('./tasker/job_dequeuer.js');
const infection_handler = require('./infection/infection_handler.js');

exports.helloWorld = functions.https.onRequest(async (request, response) => {
  try {
    // await reddit_util.test();
    // let mentionParcels = await reddit_util.getAllMentionParcels();
    // console.log(mentionParcels);

    // let mentionParcels = await reddit_util.getAllMentionParcels();
    // console.log(mentionParcels);

    // Add each parcel to the pending queue in firestore
    let enqueueResponses = await job_enqueuer.enqueueMentionsToPendingList(admin, firestore, mentionParcels);

    let dequeuedJobDocuments = await job_dequeuer.dequeueExpiredMentionsFromPending(admin, firestore);
    await infection_handler.handleNewMentionJobs(admin, firestore, dequeuedJobDocuments);

    // await reddit_util.setUserInfectionFlair("'call_me_miguel'", 5, 100);
    response.send("all good");
    return;
  } catch (err) {
    console.log(`Last stage caught error ${err}`);
    console.log(err);
    return "fuck";
  }
});

exports.createGenesisUser = functions.https.onRequest(async (request, response) => {
  try {
    await infection_handler.createGenesisInfection(admin, firestore, "call_me_miguel");
    return response.send("created gensis user... me!");
  } catch (err) {
    console.log(`Last stage caught error ${err}`);
    console.log(err);
    return "fuck";
  }
});

exports.scheduledMentionEnqueuer = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  try {
    let mentionParcels = await reddit_util.getAllMentionParcels();
    console.log(mentionParcels);

    // Add each parcel to the pending queue in firestore
    let enqueueResponses = await job_enqueuer.enqueueMentionsToPendingList(admin, firestore, mentionParcels);
    console.log(enqueueResponses);
    console.log("Enqueued mentions!");
  } catch (err) {
    console.error(err);
  }
  return null;
});

exports.scheduledMentionDequeuer = functions.pubsub.schedule('every 20 minutes').onRun(async (context) => {
  try {
    let dequeuedJobDocuments = await job_dequeuer.dequeueExpiredMentionsFromPending(admin, firestore);
    await infection_handler.handleNewMentionJobs(admin, firestore, dequeuedJobDocuments);
  } catch (err) {
    console.error(err);
  }
  return null;
});