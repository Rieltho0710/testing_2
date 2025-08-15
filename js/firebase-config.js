// js/firebase-config.js
// --- IMPORTANT ---
// Replace the placeholder strings below with your Firebase project config.
// You can find these settings in the Firebase Console (Project Settings).

const firebaseConfig = {
  apiKey: "AIzaSyAt8wJzeOA1Ewi8ook67NNE6_gXTJuqXxQ",
  authDomain: "smartlib-team.firebaseapp.com",
  projectId: "smartlib-team",
  storageBucket: "smartlib-team.firebasestorage.app",
  messagingSenderId: "765080868030",
  appId: "1:765080868030:web:8905d5487ea2e01a07faef",
  measurementId: "G-0LCPPKFPQX"
};

// Initialize Firebase (v8)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Expose auth and firestore for app.js
const auth = firebase.auth();
const db = firebase.firestore();
