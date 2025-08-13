// ==UserScript==
// @name         Eschaton Client 
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  A bespoke client for GeoFS, by Zeta
// @author       Zeta
// @match        https://www.geo-fs.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(async function() {
    "use strict";

    const baseUrl = "https://raw.githubusercontent.com/ZetaPossibly/Bespoke-Client/refs/heads/main/*?token=GHSAT0AAAAAADJFBJVXZY3CAVEK345TPJSA2E42A5Q";
    const getUrl = (path) => baseUrl.replace("*", path);

    const dependencies = {
        jeeliz: getUrl("libraries/jeeliz/lib.js"),
    }

    const mods = {
        lookout: getUrl("mods/lookout/main.js"),
        hmd: getUrl("mods/hmd/main.js"),
    }

    async function addCode(url, place = "body") {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const scriptText = await response.text();
            const scriptEl = document.createElement("script");
            scriptEl.textContent = scriptText;

            (place === "head") ? document.head.appendChild(scriptEl) : document.body.appendChild(scriptEl)
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    async function loadScripts(scripts) {
        for (const [name, url] of Object.entries(scripts)) {
            await addCode(url);
        }
    }

    // I WANT TO LOAD THESE ONE BEFORE ANOTHER
    await loadScripts(dependencies)
    await loadScripts(mods);

})();