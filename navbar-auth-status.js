// navbar-auth-status.js
import { observeUser, logoutUser } from './firebase-auth-utils.js';
import { auth } from './firebase-init.js'; // 確保 auth 從 firebase-init.js 匯出

document.addEventListener('DOMContentLoaded', () => {
    const accountEmail = document.getElementById("accountEmail");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginLink = document.getElementById("loginLink");
    const userEmailDisplay = document.getElementById("userEmailDisplay"); // 用於顯示頭像旁邊的email或"訪客"
    const userDisplayNameNav = document.getElementById("userDisplayNameNav"); // 新增：用於導覽列顯示用戶名


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

            // 顯示用戶名，如果沒有設定則顯示 Email
            if (userDisplayNameNav) {
                userDisplayNameNav.textContent = user.displayName || user.email;
            } else if (userEmailDisplay) { // 如果沒有獨立的用戶名顯示元素，可以在這裡調整顯示邏輯
                userEmailDisplay.textContent = user.displayName || user.email;
            }
        } else {
            // 未登入
            if (accountEmail) accountEmail.textContent = "尚未登入";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (loginLink) loginLink.style.display = "block";
            if (userEmailDisplay) {
                userEmailDisplay.title = "訪客";
                userEmailDisplay.querySelector('img').alt = "訪客";
            }
            if (userDisplayNameNav) userDisplayNameNav.textContent = "訪客"; // 確保未登入時也顯示 "訪客"
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
    dropdownToggleList.forEach(dropdownToggle => {
        new bootstrap.Dropdown(dropdownToggle);
    });
});