// ==UserScript==
// @name         YouTube One Tab Lock - Mobile Fix
// @namespace    http://tampermonkey.net/
// @version      7.2
// @description  Only allow one YouTube tab — with auto-expiring lock (mobile-friendly)
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @downloadURL  https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/main/Main%20TAB%20LOCK%20Mobile.js
// @updateURL    https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/main/Main%20TAB%20LOCK%20Mobile.js
// @grant        none
// ==/UserScript==

(function () {
    const LOCK_KEY = 'yt_tab_lock';
    const EXPIRY = 6000; // 6 seconds
    const PING_INTERVAL = 2000;

    // Try to reuse same tab ID if already stored
    let myID = sessionStorage.getItem('yt_tab_id');
    if (!myID) {
        myID = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sessionStorage.setItem('yt_tab_id', myID);
    }

    let ownsLock = false;
    let blocked = false;

    function parseLock(value) {
        if (!value) return null;
        const [timestamp, id] = value.split('|');
        return { time: parseInt(timestamp), id };
    }

    function claimOrRespectLock() {
        const now = Date.now();
        const lock = parseLock(localStorage.getItem(LOCK_KEY));

        if (!lock || now - lock.time > EXPIRY) {
            // No lock or expired — claim it
            localStorage.setItem(LOCK_KEY, `${now}|${myID}`);
            ownsLock = true;
            console.log('[YT-LOCK] Claimed lock.');
        } else if (lock.id === myID) {
            // We already own it — keep going
            ownsLock = true;
            console.log('[YT-LOCK] Resuming existing lock.');
        } else {
            // Another tab has lock — block self
            blockTab(lock.id);
        }
    }

    function blockTab(holderID) {
        if (blocked) return;
        blocked = true;
        console.warn(`[YT-LOCK] This tab is blocked. Lock is with: ${holderID}`);

        setTimeout(() => {
            while (document.body.firstChild) {
                document.body.removeChild(document.body.firstChild);
            }

            document.body.style.cssText = `
                background-color: #000;
                color: #fff;
                font-family: sans-serif;
                margin: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
            `;

            const h1 = document.createElement('h1');
            h1.textContent = '🚫 YouTube already open';
            h1.style.fontSize = '2em';

            const p = document.createElement('p');
            p.textContent = 'Only one tab is allowed at a time.';

            document.body.appendChild(h1);
            document.body.appendChild(p);
        }, 100);
    }

    function pingLoop() {
        setInterval(() => {
            if (ownsLock) {
                const now = Date.now();
                const lock = parseLock(localStorage.getItem(LOCK_KEY));
                if (!lock || lock.id === myID) {
                    localStorage.setItem(LOCK_KEY, `${now}|${myID}`);
                }
            }
        }, PING_INTERVAL);
    }

    // Release lock if possible
    window.addEventListener('beforeunload', () => {
        const lock = parseLock(localStorage.getItem(LOCK_KEY));
        if (lock && lock.id === myID) {
            localStorage.removeItem(LOCK_KEY);
            console.log('[YT-LOCK] Released lock.');
        }
    });

    // React to lock stolen
    window.addEventListener('storage', (e) => {
        if (e.key === LOCK_KEY && !blocked) {
            const lock = parseLock(e.newValue);
            if (lock && lock.id !== myID) {
                console.warn('[YT-LOCK] Detected lock stolen. Blocking self.');
                ownsLock = false;
                blockTab(lock.id);
            }
        }
    });

    // Initial
    claimOrRespectLock();
    if (ownsLock) pingLoop();
})();
