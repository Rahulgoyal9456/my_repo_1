// ==UserScript==
// @name         YouTube Force Original Audio Track
// @namespace    https://rahulgoyal.net/
// @version      1.0
// @description  Force YouTube to play original (non-dubbed) audio when multiple tracks exist
// @match        *://www.youtube.com/*
// @match        *://m.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Wait until the player config is ready
    function waitForPlayerConfig(callback) {
        let tries = 0;
        const maxTries = 20;
        const interval = setInterval(() => {
            tries++;
            if (window.ytInitialPlayerResponse && window.ytInitialPlayerResponse.audioTracks) {
                clearInterval(interval);
                callback(window.ytInitialPlayerResponse);
            }
            if (tries > maxTries) {
                clearInterval(interval);
                console.warn('[YT-AUDIO] Could not find audio track info.');
            }
        }, 500);
    }

    waitForPlayerConfig((data) => {
        const tracks = data.audioTracks || [];
        if (tracks.length > 1) {
            const originalTrack = tracks.find(track => track.isOriginal);
            if (originalTrack) {
                console.log(`[YT-AUDIO] Found original audio track: ${originalTrack.displayName}`);

                // Now force this track to be selected
                // Unfortunately, YouTube web player doesn’t expose a method to change it
                // This is a placeholder for potential experimental playback control
                // We can later try reloading with correct params or using `player.setPlaybackAudioTrack`

                alert(`Original audio detected: ${originalTrack.displayName}\nBut YouTube doesn't allow switching via script on web — yet.`);
            } else {
                console.warn('[YT-AUDIO] Original track not found.');
            }
        } else {
            console.log('[YT-AUDIO] Only one audio track found.');
        }
    });
})();
  
