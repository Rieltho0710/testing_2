// js/firebase-config.js
// --- IMPORTANT ---
// Replace the placeholder strings below with your Firebase project config.
// You can find these settings in the Firebase Console (Project Settings).

const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Initialize Firebase (v8)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expose auth and firestore for app.js
const auth = firebase.auth();
const db = firebase.firestore();
