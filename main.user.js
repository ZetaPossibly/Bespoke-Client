// ==UserScript==
// @name         Bespoke Client
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A bespoke client for GeoFS, by Zeta
// @author       Zeta
// @match        https://*.geo-fs.com/geofs.php?v=*
// @run-at       document-idle
// @downloadURL  https://github.com/ZetaPossibly/Bespoke-Client/raw/refs/heads/dev/main.user.js
// @updateURL    https://github.com/ZetaPossibly/Bespoke-Client/raw/refs/heads/dev/main.user.js
// @grant        none
// ==/UserScript==

// >> Loads in the most up-to-date version of the client <<
await loadClient() 


async function loadClient() {
    try {
        const response = await fetch("https://raw.githubusercontent.com/ZetaPossibly/Bespoke-Client/refs/heads/dev/src/main.js");
        const scriptText = await response.text();
        const scriptEl = document.createElement("script");
        scriptEl.textContent = scriptText;
        document.body.appendChild(scriptEl)
    } catch (err) {
        alert("Fetch error:", err);
    }
}


