// quiz-logic.js

import { observeUser, updateQuizScore } from './firebase-auth-utils.js';

let currentUser = null; // 儲存當前登入用戶資訊
let vocab = []; // 單字資料，將由 initializeQuiz 傳入
let unitIdentifier = ""; // 單元識別符，將由 initializeQuiz 傳入

let shuffledVocab = [];
let currentIndex = 0;
let score = 0;

let questionDisplay; // 顯示問題的元素
let optionsBox;      // 選項按鈕的容器
let feedback;        // 反饋信息的元素
let progressBar;     // 進度條的元素
let questionCounter; // 題號顯示的元素
let quizBox;         // 整個測驗區塊的容器

// 語音播放相關
let currentAudio = null; // 用來儲存當前播放的音頻物件

// 監聽 Firebase 登入狀態，設定 currentUser
observeUser(user => {
  currentUser = user;
});

// 打亂陣列的函數（Fisher-Yates shuffle）
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * 初始化測驗。
 * @param {Array} vocabData 包含單字資料的陣列。
 * @param {string} unitId 該測驗所屬的單元識別符 (例如 "unit1")。
 */
export function initializeQuiz(vocabData, unitId) {
  vocab = vocabData; // 設定單字資料
  unitIdentifier = unitId; // 設定單元識別符

  // 獲取 DOM 元素引用 (確保在 initializeQuiz 被調用時 DOM 元素已載入)
  questionDisplay = document.getElementById("questionDisplay");
  optionsBox = document.getElementById("optionsBox");
  feedback = document.getElementById("feedback");
  progressBar = document.getElementById("progress-bar");
  questionCounter = document.getElementById("questionCounter");
  quizBox = document.querySelector(".quiz-box");

  // 初始化時就打亂單字
  shuffleArray(vocab);
  shuffledVocab = [...vocab]; // 複製一份，用於重新測驗時重置

  // 頁面載入後立即生成第一道題
  // 注意：這裡使用 DOMContentLoaded，確保 initializeQuiz 是在頁面載入後調用
  // 或者在 HTML 中調用 initializeQuiz 時確保 DOM 已準備就緒
  // 如果 initializeQuiz 是在 <script type="module"> 且在 body 底部調用，通常是安全的。
  generateQuestion();
}

/**
 * 播放韓文單字的語音。
 * @param {string} text 要播放的韓文文字。
 */
function speakKorean(text) {
  if ('speechSynthesis' in window) {
    if (currentAudio) {
      speechSynthesis.cancel(); // 停止任何正在播放的語音
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR'; // 設定韓文語系
    utterance.rate = 0.8; // 可以調整語速，例如 0.8 倍速
    speechSynthesis.speak(utterance);
    currentAudio = utterance; // 儲存當前音頻物件
  } else {
    console.warn("您的瀏覽器不支持語音合成。");
    // 可以提供一個備用方案，例如顯示一個提示
  }
}

function generateQuestion() {
  if (currentIndex < shuffledVocab.length) {
    const currentWord = shuffledVocab[currentIndex];
    questionDisplay.textContent = currentWord.word; // 顯示韓文單字

    // 播放語音
    speakKorean(currentWord.word);

    optionsBox.innerHTML = ""; // 清空之前的選項
    // 打亂選項並創建按鈕
    const shuffledOptions = [...currentWord.options];
    shuffleArray(shuffledOptions);

    shuffledOptions.forEach(option => {
      const button = document.createElement("button");
      button.classList.add("btn", "btn-outline-primary", "option-btn");
      button.textContent = option;
      button.addEventListener("click", () => checkAnswer(option, currentWord.meaning));
      optionsBox.appendChild(button);
    });

    // 更新進度條和題號
    updateProgressBar();
    updateQuestionCounter();
    feedback.textContent = ""; // 清空反饋信息
  } else {
    endQuiz();
  }
}

function checkAnswer(selectedOption, correctAnswer) {
  if (selectedOption === correctAnswer) {
    feedback.textContent = "正確！";
    feedback.classList.remove("text-danger");
    feedback.classList.add("text-success");
    score++;
  } else {
    feedback.textContent = `錯誤！正確答案是：${correctAnswer}`;
    feedback.classList.remove("text-success");
    feedback.classList.add("text-danger");
  }

  // 禁用所有選項按鈕
  Array.from(optionsBox.children).forEach(button => {
    button.disabled = true;
  });

  // 延遲一段時間後顯示下一題
  setTimeout(() => {
    currentIndex++;
    generateQuestion();
  }, 1500); // 1.5 秒後進入下一題
}

function updateProgressBar() {
  const progress = (currentIndex / shuffledVocab.length) * 100;
  progressBar.style.width = `${progress}%`;
  progressBar.setAttribute("aria-valuenow", progress);
}

function updateQuestionCounter() {
  questionCounter.textContent = `題號：${currentIndex} / ${shuffledVocab.length}`;
}

async function endQuiz() {
  if (currentAudio) {
    speechSynthesis.cancel(); // 測驗結束時停止語音
  }

  let resultHtml = `<h3>測驗結束！</h3><p>你的分數是：${score} / ${shuffledVocab.length}</p>`;

  // 如果用戶已登入，顯示儲存進度或鼓勵登入
  if (currentUser && currentUser.uid) { // 確保 currentUser 和 UID 存在
    resultHtml += `<p class="text-success">成績已自動儲存。</p>`;
    try {
      // 調用 firebase-auth-utils.js 中的 updateQuizScore 函數
      await updateQuizScore(currentUser.uid, unitIdentifier, score, shuffledVocab.length);
    } catch (error) {
      console.error("儲存測驗分數失敗:", error);
      resultHtml += `<p class="text-danger">成績儲存失敗，請檢查網路連接或 Firebase 設定。</p>`;
    }
  } else {
    const loginPrompt = document.createElement("p");
    loginPrompt.classList.add("text-info");
    loginPrompt.innerHTML = '登入後可記錄學習進度！<a href="login.html" class="alert-link">點擊登入</a>';
    resultHtml += loginPrompt.outerHTML;
  }

  resultHtml += `<button class="btn btn-info mt-3" id="restartQuizBtn">重新測驗</button>`;

  quizBox.innerHTML = resultHtml;

  const restartBtn = document.getElementById("restartQuizBtn");
  if (restartBtn) {
    restartBtn.addEventListener("click", restartQuiz);
  }
}

// 重新測驗函數
function restartQuiz() {
  currentIndex = 0;
  score = 0;
  feedback.textContent = "";
  shuffledVocab = [...vocab]; // 重新複製 vocab，確保每次測驗都從完整的單字列表開始
  shuffleArray(shuffledVocab); // 重新打亂

  // 重新構建 quiz-box 的內容，包括問題、選項、進度等
  quizBox.innerHTML = `
    <h4 id="questionDisplay"></h4>
    <div id="optionsBox" class="d-flex flex-wrap justify-content-center">
      </div>
    <p id="feedback" class="feedback text-danger"></p>
    <div id="progress-bar-container">
      <div id="progress-bar"></div>
    </div>
    <p class="mt-2 text-muted" id="questionCounter">題號：0 / 0</p>
  `;

  // 重新獲取 DOM 元素引用
  questionDisplay = document.getElementById("questionDisplay"); // 需要重新引用，因為 HTML 內容被替換了
  optionsBox = document.getElementById("optionsBox");
  feedback = document.getElementById("feedback");
  progressBar = document.getElementById("progress-bar");
  questionCounter = document.getElementById("questionCounter");

  generateQuestion();
}