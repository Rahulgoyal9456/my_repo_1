// ==UserScript==
// @name         YouTube One Tab Lock - Mobile Fix
// @namespace    http://tampermonkey.net/
// @version      5.4
// @description  Only allow one YouTube tab — with auto-expiring lock (mobile-friendly)
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @downloadURL  https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/main/Main%20TAB%20LOCK.js
// @updateURL    https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/main/Main%20TAB%20LOCK.js
// @grant        none
// ==/UserScript==

(function () {
    const LOCK_KEY = 'yt_tab_lock';
    const EXPIRY_MS = 20000; // 20 seconds
    const myID = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const now = Date.now();
    let ownsLock = false;
    let blocked = false;

    console.log(`[YT-LOCK] This tab's ID: ${myID}`);

    function parseLock(lockValue) {
        if (!lockValue) return null;
        const [timestampStr, id] = lockValue.split('|');
        return {
            timestamp: parseInt(timestampStr, 10),
            id
        };
    }

    function claimLock() {
        const raw = localStorage.getItem(LOCK_KEY);
        const lock = parseLock(raw);

        if (!lock || now - lock.timestamp > EXPIRY_MS) {
            // Stale or no lock
            localStorage.setItem(LOCK_KEY, `${now}|${myID}`);
            ownsLock = true;
            console.log('[YT-LOCK] Claimed lock.');
        } else if (lock.id !== myID) {
            console.warn(`[YT-LOCK] Lock held by another tab: ${lock.id}`);
            blockTab();
        } else {
            ownsLock = true;
            console.log('[YT-LOCK] Already owns lock.');
        }
    }

    function blockTab() {
        if (blocked) return;
        blocked = true;
        console.warn('[YT-LOCK] Blocking this tab.');

        window.addEventListener('load', () => {
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

    claimLock();

    window.addEventListener('storage', (event) => {
        if (event.key === LOCK_KEY) {
            const newLock = parseLock(event.newValue);
            if (newLock && newLock.id !== myID) {
                console.warn('[YT-LOCK] Lock stolen. Blocking this tab.');
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

    // Even if unload doesn’t fire, lock will auto-expire
    window.addEventListener('beforeunload', () => {
        const raw = localStorage.getItem(LOCK_KEY);
        const lock = parseLock(raw);
        if (lock && lock.id === myID) {
            console.log('[YT-LOCK] Releasing lock on unload.');
            localStorage.removeItem(LOCK_KEY);
        }
    });
})();
