// ==UserScript==
// @name         YouTube One Tab Lock - CSP Safe
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  Only allow one YouTube tab — safe under Content Security Policy
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @downloadURL  https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/main/Main%20TAB%20LOCK.js
// @updateURL    https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/main/Main%20TAB%20LOCK.js
// @grant        none
// ==/UserScript==

(function () {
    const LOCK_KEY = 'yt_tab_lock';
    const myID = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let ownsLock = false;
    let blocked = false;

    console.log(`[YT-LOCK] This tab's ID: ${myID}`);

    function claimLock() {
        const currentLock = localStorage.getItem(LOCK_KEY);

        if (!currentLock) {
            localStorage.setItem(LOCK_KEY, myID);
            ownsLock = true;
            console.log('[YT-LOCK] Claimed lock.');
        } else if (currentLock !== myID) {
            console.log(`[YT-LOCK] Lock held by another tab: ${currentLock}`);
            blockTab();
        } else {
            console.log('[YT-LOCK] Already owns lock.');
        }
    }

    function blockTab() {
        if (blocked) return;
        blocked = true;
        console.warn('[YT-LOCK] Blocking this tab.');

        // Wait for YouTube’s SPA to render, then wipe it clean
        window.addEventListener('load', () => {
            setTimeout(() => {
                while (document.body.firstChild) {
                    document.body.removeChild(document.body.firstChild);
                }

                // Styling
                document.body.style.backgroundColor = '#000';
                document.body.style.color = '#fff';
                document.body.style.fontFamily = 'sans-serif';
                document.body.style.margin = '0';
                document.body.style.display = 'flex';
                document.body.style.flexDirection = 'column';
                document.body.style.justifyContent = 'center';
                document.body.style.alignItems = 'center';
                document.body.style.height = '100vh';
                document.body.style.textAlign = 'center';

                // Content
                const heading = document.createElement('h1');
                heading.textContent = '🚫 YouTube already open';
                heading.style.fontSize = '2em';

                const msg = document.createElement('p');
                msg.textContent = 'Only one tab allowed at a time.';

                document.body.appendChild(heading);
                document.body.appendChild(msg);
            }, 100);
        });
    }

    // Initial lock attempt
    claimLock();

    // React if another tab steals the lock
    window.addEventListener('storage', (event) => {
        if (event.key === LOCK_KEY && event.newValue !== myID) {
            console.warn('[YT-LOCK] Lock stolen by another tab. Blocking this one.');
            if (ownsLock) {
                ownsLock = false;
                blockTab();
            }
        }
    });

    window.addEventListener('yt-navigate-finish', () => {
    if (!ownsLock && !blocked) {
        blockTab();
    }
    });

    // Cleanup on tab close
    window.addEventListener('beforeunload', () => {
        if (ownsLock && localStorage.getItem(LOCK_KEY) === myID) {
            console.log('[YT-LOCK] Releasing lock on unload.');
            localStorage.removeItem(LOCK_KEY);
        }
    });
})();
