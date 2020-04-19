'use strict';

const functions = require('firebase-functions');
var admin = require("firebase-admin");
var serviceAccount = require("./service-account.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://reddit-infection-game.firebaseio.com"
});

const firestore = admin.firestore();
const settings = { timestampsInSnapshots: true };
firestore.settings(settings);

const reddit_util = require('./reddit/reddit_util.js');

exports.helloWorld = functions.https.onRequest((request, response) => {
  try {
    reddit_util.test();
    response.send("all good");
    return;
  } catch (err) {
    console.log(`Last stage caught error ${err}`);
    console.log(err);
    return "fuck";
  }
});