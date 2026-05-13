import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBDCpA5itXcxeDkGnYSFAX0G_l7ssmn5TU",
  authDomain: "eurovision-fantasy-dcb0c.firebaseapp.com",
  projectId: "eurovision-fantasy-dcb0c",
  storageBucket: "eurovision-fantasy-dcb0c.firebasestorage.app",
  messagingSenderId: "64114760726",
  appId: "1:64114760726:web:5ab066eee170e2ca612937",
  measurementId: "G-NEKNH17NFL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const appId = "eurovision-fantasy-v1";
