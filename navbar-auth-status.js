// navbar-auth-status.js
import { observeUser, logoutUser } from './firebase-auth-utils.js';
import { auth } from './firebase-init.js'; // 確保 auth 從 firebase-init.js 匯出

document.addEventListener('DOMContentLoaded', () => {
    const accountEmail = document.getElementById("accountEmail");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginLink = document.getElementById("loginLink");
    const userEmailDisplay = document.getElementById("userEmailDisplay"); // 用於顯示頭像旁邊的email或"訪客"

    // 監聽 Firebase 登入狀態
    observeUser(user => {
        if (user) {
            // 已登入
            if (accountEmail) accountEmail.textContent = user.email;
            if (logoutBtn) logoutBtn.style.display = "block";
            if (loginLink) loginLink.style.display = "none";
            if (userEmailDisplay) {
                userEmailDisplay.title = user.email;
                userEmailDisplay.querySelector('img').alt = user.email; // 也可以更新圖片的alt屬性
            }

            // 如果有需要，可以將用戶的頭像URL儲存在Firebase Firestore中，然後在這裡加載：
            // if (userEmailDisplay) userEmailDisplay.querySelector('img').src = user.photoURL || "https://via.placeholder.com/40";
        } else {
            // 未登入
            if (accountEmail) accountEmail.textContent = "尚未登入";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (loginLink) loginLink.style.display = "block";
            if (userEmailDisplay) {
                userEmailDisplay.title = "訪客";
                userEmailDisplay.querySelector('img').alt = "訪客";
            }
            // 預設頭像
            // if (userEmailDisplay) userEmailDisplay.querySelector('img').src = "https://via.placeholder.com/40";
        }
    });

    // 登出功能
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await logoutUser();
                // 登出後重新載入頁面，確保所有狀態更新
                location.reload();
            } catch (error) {
                console.error("登出失敗:", error);
                alert("登出失敗，請重試。");
            }
        });
    }

    // 初始化 Bootstrap dropdowns (如果您在其他頁面也使用)
    const dropdownToggleList = document.querySelectorAll('.dropdown-toggle');
    if (dropdownToggleList.length > 0) {
        dropdownToggleList.forEach(dropdownToggleEl => {
            new bootstrap.Dropdown(dropdownToggleEl);
        });
    }
});