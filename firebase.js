const admin = require('firebase-admin');
const serviceAccount = require('./ServiceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://the-m-float.firebaseio.com'
});

const db = admin.firestore();
module.exports = { db };