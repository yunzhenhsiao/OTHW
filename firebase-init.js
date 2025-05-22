import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqjAZZFRfwR6-z3-h_qrB6ArQoJDw-Td4",
  authDomain: "klearning-e3cd9.firebaseapp.com",
  projectId: "klearning-e3cd9",
  storageBucket: "klearning-e3cd9.appspot.com",
  messagingSenderId: "93768752545",
  appId: "1:93768752545:web:60016adba1f1174dc2ffe0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
