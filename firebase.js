const admin = require('firebase-admin');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://the-m-float.firebaseio.com'
});

const db = admin.firestore();
module.exports = { db };
