
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "compsubmit",
  "appId": "1:420069458557:web:d046096d7eeb2da262e714",
  "storageBucket": "compsubmit.firebasestorage.app",
  "apiKey": "AIzaSyAtygLx6-0bV9tbvEUJtm-gcWBXnh9c3TE",
  "authDomain": "compsubmit.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "420069458557"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
