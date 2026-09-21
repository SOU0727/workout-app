import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVKmmTmAOnrb0ogGdwt9btPgcymWAGbfI",
  authDomain: "workout-app-73e8a.firebaseapp.com",
  projectId: "workout-app-73e8a",
  storageBucket: "workout-app-73e8a.firebasestorage.app",
  messagingSenderId: "106044358534",
  appId: "1:106044358534:web:18c92d8d3b876f065d3607"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);