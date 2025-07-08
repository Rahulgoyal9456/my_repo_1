// ==UserScript==
// @name         YouTube One Tab Lock - Mobile Fix
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  Only allow one YouTube tab — with auto-expiring lock (mobile-friendly)
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @downloadURL  https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/refs/heads/main/Main%20TAB%20LOCK%20Mobile.js
// @updateURL    https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/refs/heads/main/Main%20TAB%20LOCK%20Mobile.js
// @grant        none
// ==/UserScript==

(function () {
    const CHANNEL_NAME = 'yt_tab_lock_channel';
    const HEARTBEAT_INTERVAL = 5000; // 5 seconds
    const TIMEOUT_MS = 7000; // Time to wait before assuming other tab is gone

    const channel = new BroadcastChannel(CHANNEL_NAME);
    const myID = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let isLocked = false;
    let lastHeartbeat = 0;
    let blocked = false;

    console.log(`[YT-LOCK] My ID: ${myID}`);

    function becomeLeader() {
        isLocked = true;
        console.log('[YT-LOCK] This tab has become the lock holder.');
        startHeartbeat();
    }

    function startHeartbeat() {
        setInterval(() => {
            if (isLocked) {
                channel.postMessage({ type: 'heartbeat', from: myID, time: Date.now() });
            }
        }, HEARTBEAT_INTERVAL);
    }

    function blockTabUI() {
        if (blocked) return;
        blocked = true;

        console.warn('[YT-LOCK] Blocking this tab: another active tab is present.');

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

    // Listen for heartbeats
    channel.addEventListener('message', (e) => {
        if (e.data && e.data.type === 'heartbeat' && e.data.from !== myID) {
            lastHeartbeat = Date.now();
            if (!isLocked && !blocked) {
                blockTabUI();
            }
        }
    });

    // Monitor to decide if we can become leader
    setTimeout(() => {
        const now = Date.now();
        if (now - lastHeartbeat > TIMEOUT_MS) {
            becomeLeader();
        } else {
            blockTabUI();
        }
    }, 500);
})();

