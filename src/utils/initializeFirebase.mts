// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByHPurxw0XB77zSf1d9Qus81sBWW7NtXU",
  authDomain: "sf-tenant-food.firebaseapp.com",
  projectId: "sf-tenant-food",
  storageBucket: "sf-tenant-food.firebasestorage.app",
  messagingSenderId: "204348098401",
  appId: "1:204348098401:web:378cb44a0f831f1a65e720"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);