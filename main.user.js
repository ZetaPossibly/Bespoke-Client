// ==UserScript==
// @name         Bespoke Client [DEVELOPMENT]
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  A bespoke client for GeoFS, by Zeta
// @author       Zeta
// @match        https://www.geo-fs.com/geofs.php?v=*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(async function() {
    "use strict";
    async function loadClient() {
        try {
            const response = await fetch("https://raw.githubusercontent.com/ZetaPossibly/Bespoke-Client/refs/heads/main/src/main.js");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const scriptText = await response.text();
            const scriptEl = document.createElement("script");
            scriptEl.textContent = scriptText;
            document.body.appendChild(scriptEl)
        } catch (err) {
            alert("Fetch error:", err);
        }
    }

    // >> Loads in the most up-to-date version of the client <<
    await loadClient() 
})();