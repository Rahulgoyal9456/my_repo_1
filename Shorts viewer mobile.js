// ==UserScript==
// @name         YouTube Shorts to Watch Redirect (Live Detection)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Redirect Shorts to normal player even when clicked without page reload
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @downloadURL  https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/refs/heads/main/Shorts%20viewer.js
// @updateURL    https://raw.githubusercontent.com/Rahulgoyal9456/my_repo_1/refs/heads/main/Shorts%20viewer.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    function redirectIfShorts(url = location.href) {
        const shortsRegex = /\/shorts\/([a-zA-Z0-9_-]{11})/;
        const match = shortsRegex.exec(url);
        if (match) {
            const videoId = match[1];
            const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
            console.log(`[YT-SHORTS] Redirecting to normal view: ${watchUrl}`);
            window.location.replace(watchUrl);
        }
    }

    // Initial load (e.g. direct paste of a Shorts URL)
    redirectIfShorts();

    // Detect SPA navigation via YouTube’s own event
    window.addEventListener('yt-navigate-finish', () => {
        redirectIfShorts();
    });

    // Just in case: observe URL changes in history (fallback)
    let lastHref = location.href;
    setInterval(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            redirectIfShorts();
        }
    }, 500);
})();
