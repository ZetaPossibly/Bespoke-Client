// ==UserScript==
// @name         Bespoke Client 
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  A bespoke client for GeoFS, by Zeta
// @author       Zeta
// @match        https://www.geo-fs.com/geofs.php?v=*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(async function() {
    "use strict";
    async function addCode(url, place = "body") {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const scriptText = await response.text();
            const scriptEl = document.createElement("script");
            scriptEl.textContent = scriptText;

            (place === "head") ? document.head.appendChild(scriptEl) : document.body.appendChild(scriptEl)
        } catch (err) {
            alert("Fetch error:", err);
        }
    }

    async function loadScripts(scripts) {
        for (const [name, url] of Object.entries(scripts)) {
            await addCode(url);
        }
    }

    const initClient = async function() {
        if (typeof geofs === 'undefined') {
            setTimeout(initClient, 1000);
            return;
        }

        await(addCode("https://raw.githubusercontent.com/ZetaPossibly/Bespoke-Client/refs/heads/main/manager.js"))

        await loadScripts(helpers)
        await loadScripts(scripts);
    }

    initClient()

})();