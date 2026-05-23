// ==UserScript==
// @name         YouTube One Tab Lock - CSP Safe
// @namespace    http://tampermonkey.net/
// @version      5.3
// @description  Only allow one YouTube tab — safe under Content Security Policy
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @icon         https://upload.wikimedia.org/wikipedia/commons/6/62/YouTube_social_white_square_%282024%29.svg
// @downloadURL  https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/refs/heads/main/Main%20TAB%20LOCK.js
// @updateURL    https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/refs/heads/main/Main%20TAB%20LOCK.js
// @grant        window.close
// ==/UserScript==

/*(function () {
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
            closetab();
        } else {
            console.log('[YT-LOCK] Already owns lock.');
        }
    }

    function closetab() {
        setTimeout(() => {
            window.close();
        }, 500);
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
                closetab();
            }
        }
    });

    window.addEventListener('yt-navigate-finish', () => {
    if (!ownsLock && !blocked) {
        blockTab();
        closetab();
    }
    });

    // Cleanup on tab close
    window.addEventListener('beforeunload', () => {
        if (ownsLock && localStorage.getItem(LOCK_KEY) === myID) {
            console.log('[YT-LOCK] Releasing lock on unload.');
            localStorage.removeItem(LOCK_KEY);
        }
    });
})();*/

(function () {

    const LOCK_KEY = 'yt_tab_lock';
    const HEARTBEAT_TIMEOUT = 4000;

    const myID =
        `${Date.now()}_${Math.random().toString(36).slice(2)}`;

    let ownsLock = false;
    let blocked = false;

    console.log('[YT-LOCK] TAB ID:', myID);

    // -----------------------------
    // HEARTBEAT
    // -----------------------------

    function writeHeartbeat() {
        if (!ownsLock) return;

        localStorage.setItem(LOCK_KEY, JSON.stringify({
            id: myID,
            time: Date.now()
        }));
    }

    setInterval(writeHeartbeat, 1000);

    // -----------------------------
    // LOCK VALIDATION
    // -----------------------------

    function getLock() {
        try {
            return JSON.parse(localStorage.getItem(LOCK_KEY));
        } catch {
            return null;
        }
    }

    function isLockAlive(lock) {

        if (!lock) return false;

        const age = Date.now() - lock.time;

        return age < HEARTBEAT_TIMEOUT;
    }

    // -----------------------------
    // Filter
    // -----------------------------

    const IGNORE_RULES = [

        {
            domain: 'google.',
            ignoreAll: false,

            selectors: [
                '.ULSxyf',
                '.rHJjod',
                '.Ea5p3b',
                '[data-vid]'
            ]
        },

        {
            domain: 'example.com',
            ignoreAll: true
        }
    ];

    function matchesDomain(ruleDomain) {

        const hostname = location.hostname;
        const referrer = document.referrer || '';

        return (
            hostname.includes(ruleDomain) ||
            referrer.includes(ruleDomain)
        );
    }

//    function isIgnoredContext() {
//
//        for (const rule of IGNORE_RULES) {
//
//            if (!matchesDomain(rule.domain)) {
//                continue;
//            }
//
//            // Ignore whole domain
//            if (rule.ignoreAll) {
//                return true;
//            }
//
//            // Ignore when selectors exist
//            if (rule.selectors?.length) {
//
//                for (const selector of rule.selectors) {
//
//                    try {
//
//                        if (document.querySelector(selector)) {
//
//                            console.log(
//                                '[YT-LOCK] Ignored selector:',
//                                selector
//                            );
//
//                            return true;
//                        }
//
//                    } catch (e) {
//
//                        console.warn(
//                            '[YT-LOCK] Invalid selector:',
//                            selector
//                        );
//                    }
//                }
//            }
//        }
//
//        return false;
//    }
    function isEmbedded() {

        try {
            return window.self !== window.top;
        } catch {
            return true;
        }
    }

    function isIgnoredContext() {

        // Ignore ONLY embedded contexts
        if (!isEmbedded()) {
            return false;
        }

        for (const rule of IGNORE_RULES) {

            if (!matchesDomain(rule.domain)) {
                continue;
            }

            // Ignore whole domain
            if (rule.ignoreAll) {
                return true;
            }

            // Ignore matching embedded contexts
            if (rule.selectors?.length) {

                return true;
            }
        }

        return false;
    }

    // -----------------------------
    // CLAIM LOCK
    // -----------------------------

    function claimLock() {

        const lock = getLock();

        // No lock OR stale lock
        if (!isLockAlive(lock)) {

            ownsLock = true;

            writeHeartbeat();

            console.log('[YT-LOCK] Claimed fresh lock');

            return;
        }

        // Already mine
        if (lock.id === myID) {

            ownsLock = true;

            return;
        }

        // Another ACTIVE tab exists
        console.log('[YT-LOCK] Active tab exists:', lock.id);

        blockTab();
        closeTab();
    }

    // -----------------------------
    // BLOCK UI
    // -----------------------------

    function blockTab() {

        if (blocked) return;

        blocked = true;

        console.warn('[YT-LOCK] Blocking tab');

        function render() {

            if (!document.body) {
                requestAnimationFrame(render);
                return;
            }

            document.documentElement.innerHTML = '';

            const body = document.createElement('body');

            body.style.cssText = `
                margin:0;
                background:black;
                color:white;
                display:flex;
                justify-content:center;
                align-items:center;
                flex-direction:column;
                height:100vh;
                font-family:sans-serif;
                text-align:center;
            `;

            const h1 = document.createElement('h1');
            h1.textContent = '🚫 YouTube already open';

            const p = document.createElement('p');
            p.textContent = 'Only one active YouTube tab allowed';

            body.appendChild(h1);
            body.appendChild(p);

            document.documentElement.appendChild(body);
        }

        render();
    }

    // -----------------------------
    // CLOSE TAB
    // -----------------------------

    function closeTab() {

        setTimeout(() => {

            try {
                window.close();
            } catch (e) {}

        }, 500);
    }

    // -----------------------------
    // STORAGE LISTENER
    // -----------------------------

    window.addEventListener('storage', (e) => {

        if (e.key !== LOCK_KEY) return;

        const lock = getLock();

        if (!lock) return;

        // Another ACTIVE tab took ownership
        if (lock.id !== myID) {

            if (isLockAlive(lock)) {

                ownsLock = false;

                console.warn('[YT-LOCK] Lost lock');

                blockTab();
                closeTab();
            }
        }
    });

    // -----------------------------
    // VISIBILITY CHECK
    // -----------------------------

    document.addEventListener('visibilitychange', () => {

        if (document.visibilityState === 'visible') {

            //claimLock();{
            if (!isIgnoredContext()) {
                claimLock();
            }
        }
    });

    // -----------------------------
    // SPA NAVIGATION
    // -----------------------------

    window.addEventListener('yt-navigate-finish', () => {

        if (!blocked) {
            //claimLock();{
            if (!isIgnoredContext()) {
                claimLock();
            }
        }
    });

    // -----------------------------
    // CLEANUP
    // -----------------------------

    window.addEventListener('beforeunload', () => {

        const lock = getLock();

        if (lock?.id === myID) {

            localStorage.removeItem(LOCK_KEY);
        }
    });

    // -----------------------------
    // START
    // -----------------------------

    //claimLock();{
    if (!isIgnoredContext()) {
        claimLock();
    }

})();

/*(function () {
    'use strict';

    const LOCK_KEY = 'yt_tab_lock_v2';

    const HEARTBEAT_MS = 1000;
    const STALE_MS = 4000;

    const myID =
        `${Date.now()}_${Math.random().toString(36).slice(2)}`;

    let ownsLock = false;
    let blocked = false;

    function now() {
        return Date.now();
    }

    function getLock() {
        try {
            return JSON.parse(localStorage.getItem(LOCK_KEY));
        } catch {
            return null;
        }
    }

    function setLock(data) {
        localStorage.setItem(LOCK_KEY, JSON.stringify(data));
    }

    function isStale(lock) {
        if (!lock) return true;
        return (now() - lock.time) > STALE_MS;
    }

    function claimLock() {
        const current = getLock();

        // No lock or stale lock
        if (!current || isStale(current)) {

            const newLock = {
                owner: myID,
                time: now()
            };

            setLock(newLock);

            // Verify ownership after write
            const verify = getLock();

            if (verify && verify.owner === myID) {
                ownsLock = true;
                console.log('[YT-LOCK] Lock claimed');
                return;
            }
        }

        // Already ours
        if (current && current.owner === myID) {
            ownsLock = true;
            return;
        }

        // Someone else owns it
        ownsLock = false;
        blockTab();
    }

    function heartbeat() {
        if (!ownsLock) return;

        const current = getLock();

        if (!current || current.owner !== myID) {
            ownsLock = false;
            blockTab();
            return;
        }

        current.time = now();
        setLock(current);
    }

    function blockTab() {
        if (blocked) return;
        blocked = true;

        console.warn('[YT-LOCK] Blocking duplicate tab');

        function renderBlockScreen() {

            if (!document.body) {
                requestAnimationFrame(renderBlockScreen);
                return;
            }

            document.documentElement.innerHTML = '';

            const body = document.createElement('body');

            body.style.margin = '0';
            body.style.background = '#000';
            body.style.color = '#fff';
            body.style.display = 'flex';
            body.style.flexDirection = 'column';
            body.style.justifyContent = 'center';
            body.style.alignItems = 'center';
            body.style.height = '100vh';
            body.style.fontFamily = 'sans-serif';

            const title = document.createElement('h1');
            title.textContent = '🚫 YouTube already open';

            const text = document.createElement('p');
            text.textContent =
                'Only one YouTube tab is allowed.';

            body.appendChild(title);
            body.appendChild(text);

            document.documentElement.appendChild(body);
        }

        renderBlockScreen();

        // Try closing
        setTimeout(() => {
            window.close();
        }, 300);
    }

    // Initial claim
    claimLock();

    // Heartbeat loop
    setInterval(() => {
        heartbeat();

        // Re-check ownership periodically
        if (!ownsLock && !blocked) {
            claimLock();
        }

    }, HEARTBEAT_MS);

    // Detect storage changes
    window.addEventListener('storage', (e) => {

        if (e.key !== LOCK_KEY) return;

        const lock = getLock();

        if (!lock) {
            claimLock();
            return;
        }

        if (lock.owner !== myID && ownsLock) {
            ownsLock = false;
            blockTab();
        }
    });

    // SPA navigation safety
    window.addEventListener('yt-navigate-finish', () => {
        if (!ownsLock) {
            blockTab();
        }
    });

    // Visibility check
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            claimLock();
        }
    });

    // Cleanup
    window.addEventListener('beforeunload', () => {

        const current = getLock();

        if (
            current &&
            current.owner === myID
        ) {
            localStorage.removeItem(LOCK_KEY);
        }
    });

})();*/
