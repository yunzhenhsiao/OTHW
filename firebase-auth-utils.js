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
  setDoc,
  getDoc,       // <<-- 新增這行
  updateDoc,    // <<-- 新增這行 (上次測驗功能已新增)
  arrayUnion    // <<-- 新增這行 (上次測驗功能已新增)
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

// 註冊功能
export async function registerUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  await setDoc(doc(db, "users", uid), {
    email: email,
    progress: {},     // 學習進度 (舊的，目前用於測驗結果)
    badges: [],       // 測驗徽章 (用於測驗是否通過)
    learnedCards: {}  // <<-- 新增這行，用於字卡學習進度
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

/**
 * 從 Firestore 獲取使用者資料
 * @param {string} uid 使用者的 UID
 * @returns {Object|null} 使用者資料物件或 null
 */
export async function getUserData(uid) { // <<-- 新增這個函數
  const userDocRef = doc(db, "users", uid);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    console.log("No such user document!");
    return null;
  }
}

/**
 * 更新使用者的學習進度和測驗徽章
 * @param {string} uid 使用者的 UID
 * @param {string} unitName 測驗單元的名稱 (例如 "單母音", "單子音")
 * @param {boolean} passedQuiz 測驗是否通過
 */
export async function updateUserProgressAndBadges(uid, unitName, passedQuiz) {
  const userDocRef = doc(db, "users", uid);
  const updateData = {};

  // 如果測驗通過，將測驗結果記錄到 badges 陣列
  if (passedQuiz) {
    updateData.badges = arrayUnion(unitName);
  } else {
    // 如果測驗未通過，但不希望移除徽章，則不需要特別處理 badges
    // 如果希望測驗未通過就移除徽章，則需要 arrayRemove，但通常不會這樣做
  }

  try {
    await updateDoc(userDocRef, updateData);
    console.log(`使用者 ${uid} 的 ${unitName} 測驗徽章狀態已更新。`);
  } catch (error) {
    console.error("更新使用者測驗徽章失敗:", error);
    throw error;
  }
}


/**
 * 更新使用者的字卡學習進度
 * @param {string} uid 使用者的 UID
 * @param {string} unitName 學習單元的名稱 (例如 "單母音", "複合母音")
 * @param {number} cardIndex 被點擊字卡的索引
 * @param {number} totalCards 該單元總字卡數
 */
export async function updateUserCardProgress(uid, unitName, cardIndex, totalCards) { // <<-- 新增這個函數
  const userDocRef = doc(db, "users", uid);
  const fieldPath = `learnedCards.${unitName}`;

  try {
    const docSnap = await getDoc(userDocRef);
    let currentLearnedCards = new Set();
    if (docSnap.exists() && docSnap.data().learnedCards && docSnap.data().learnedCards[unitName]) {
      currentLearnedCards = new Set(docSnap.data().learnedCards[unitName]);
    }

    currentLearnedCards.add(cardIndex);

    // 檢查是否所有字卡都點過
    const isCompleted = currentLearnedCards.size === totalCards;
    const progressStatus = isCompleted ? '完成學習' : '未完成學習';

    const updateData = {
      [fieldPath]: Array.from(currentLearnedCards), // 將 Set 轉回 Array 儲存
      [`progress.${unitName}`]: progressStatus // 同步更新 progress 字段
    };

    await updateDoc(userDocRef, updateData);
    console.log(`使用者 ${uid} 的 ${unitName} 字卡進度已更新：${progressStatus}`);
  } catch (error) {
    console.error("更新使用者字卡進度失敗:", error);
    throw error;
  }
}