import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiI5-jQRfX2OVRhcToO92prLKJXEHnTDo",
  authDomain: "restaurant-app-a4c4a.firebaseapp.com",
  projectId: "restaurant-app-a4c4a",
  storageBucket: "restaurant-app-a4c4a.firebasestorage.app",
  messagingSenderId: "1011716144402",
  appId: "1:1011716144402:web:52a38a75e1e331f7f187cb",
  measurementId: "G-TVCLE4L5LL"
};


const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = getAuth(app);

// Firestore Database
export const db = getFirestore(app);