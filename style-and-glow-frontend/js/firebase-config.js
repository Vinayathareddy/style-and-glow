
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCfHiOt10k68fRybxuVqngav-RcT87AY2k",
  authDomain: "style-and-glow.firebaseapp.com",
  projectId: "style-and-glow",
  storageBucket: "style-and-glow.firebasestorage.app",
  messagingSenderId: "861891593660",
  appId: "1:861891593660:web:119ab301d6d696c17b97b9"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
