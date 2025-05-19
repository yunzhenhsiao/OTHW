// firebase-auth-utils.js
import { auth, db } from './firebase-init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import {
  doc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

// 註冊功能
export async function registerUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  await setDoc(doc(db, "users", uid), {
    email: email,
    progress: {},
    badges: []
  });
  return userCredential;
}

// 登入功能
export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

// 登出功能
export async function logoutUser() {
  return await signOut(auth);
}

// 監聽登入狀態
export function observeUser(callback) {
  return onAuthStateChanged(auth, callback);
}
