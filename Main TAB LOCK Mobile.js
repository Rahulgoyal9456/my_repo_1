// ==UserScript==
// @name         YouTube One Tab Lock - Mobile Fix
// @namespace    http://tampermonkey.net/
// @version      7
// @description  Only allow one YouTube tab — with auto-expiring lock (mobile-friendly)
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @downloadURL  https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/refs/heads/main/Main%20TAB%20LOCK%20Mobile.js
// @updateURL    https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/refs/heads/main/Main%20TAB%20LOCK%20Mobile.js
// @grant        none
// ==/UserScript==

(function () {
    const LOCK_KEY = 'yt_tab_lock';
    const myID = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const EXPIRY = 5000; // lock timeout = 5s
    const PING_INTERVAL = 2000;

    let ownsLock = false;
    let blocked = false;

    function parseLock(raw) {
        if (!raw) return null;
        const [timestamp, id] = raw.split('|');
        return { time: parseInt(timestamp), id };
    }

    function claimOrBlock() {
        const now = Date.now();
        const lock = parseLock(localStorage.getItem(LOCK_KEY));

        if (!lock || now - lock.time > EXPIRY) {
            // Expired or no lock — claim it
            localStorage.setItem(LOCK_KEY, `${now}|${myID}`);
            ownsLock = true;
            console.log('[YT-LOCK] Lock claimed.');
        } else if (lock.id !== myID) {
            // Someone else has lock — block
            blockTabUI(lock.id);
        } else {
            // We already have lock
            ownsLock = true;
        }
    }

    function pingLoop() {
        setInterval(() => {
            if (ownsLock) {
                localStorage.setItem(LOCK_KEY, `${Date.now()}|${myID}`);
            }
        }, PING_INTERVAL);
    }

    function blockTabUI(otherID) {
        if (blocked) return;
        blocked = true;

        console.warn(`[YT-LOCK] This tab is blocked. Another tab (${otherID}) has the lock.`);

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
            p.textContent = 'Only one tab allowed at a time.';

            document.body.appendChild(h1);
            document.body.appendChild(p);
        }, 100);
    }

    // React to lock stolen
    window.addEventListener('storage', (e) => {
        if (e.key === LOCK_KEY && !blocked) {
            const lock = parseLock(e.newValue);
            if (lock && lock.id !== myID) {
                console.log('[YT-LOCK] Detected new lock owner.');
                if (!ownsLock) blockTabUI(lock.id);
                ownsLock = false;
            }
        }
    });

    // Release lock if possible
    window.addEventListener('beforeunload', () => {
        const lock = parseLock(localStorage.getItem(LOCK_KEY));
        if (lock && lock.id === myID) {
            localStorage.removeItem(LOCK_KEY);
        }
    });

    // Init
    claimOrBlock();
    if (ownsLock) pingLoop();
})();

