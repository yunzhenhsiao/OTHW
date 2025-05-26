// firebase-auth-utils.js
import { auth, db } from './firebase-init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile // 確保有這行
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,    // 確保有這行
  arrayUnion,
} from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js';

// 註冊功能
export async function registerUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  await setDoc(doc(db, "users", uid), {
    email: email,
    progress: {},     // 學習進度 (舊的，目前用於測驗結果)
    badges: [],       // 測驗徽章 (用於測驗是否通過)
    learnedCards: {},  // <<-- 新增這行，用於字卡學習進度
    displayName: null // 初始化 displayName 為 null
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
 * 更新使用者在 Firestore 中的學習進度及測驗徽章
 * @param {string} uid - 使用者的 UID
 * @param {string} unitName - 單元名稱 (例如: "單母音")
 * @param {boolean} passed - 測驗是否通過
 */
export async function updateUserProgressAndBadges(uid, unitName, passed) {
  const userDocRef = doc(db, "users", uid);
  const updateData = {};

  // 更新學習進度
  updateData[`progress.${unitName}`] = passed ? '已完成' : '未完成';

  // 更新測驗徽章
  if (passed) {
    updateData.badges = arrayUnion(unitName);
  }

  try {
    await updateDoc(userDocRef, updateData);
    console.log(`使用者 ${uid} 的 ${unitName} 進度已更新為 ${updateData[`progress.${unitName}`]}。`);
    if (passed) {
      console.log(`使用者 ${uid} 已獲得 ${unitName} 徽章。`);
    }
  } catch (error) {
    console.error("更新使用者進度或徽章失敗:", error);
    throw error;
  }
}

/**
 * 更新使用者字卡學習進度 (記錄已點擊的字卡)
 * @param {string} uid - 使用者的 UID
 * @param {string} unitName - 單元名稱 (例如: "單母音")
 * @param {number} cardIndex - 已點擊的字卡索引
 * @param {number} totalCards - 該單元的總字卡數
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

// 新增：更新用戶名並同步到 Firestore
export async function updateDisplayNameAndFirestore(user, newDisplayName) {
  if (!user) {
    throw new Error("沒有登入用戶。");
  }

  // 1. 更新 Firebase Authentication 的 displayName
  await updateProfile(user, {
    displayName: newDisplayName
  });

  // 2. 更新 Firestore 中的用戶名
  const userDocRef = doc(db, "users", user.uid);
  await updateDoc(userDocRef, {
    displayName: newDisplayName // 將用戶名儲存在 Firestore 中
  });
}