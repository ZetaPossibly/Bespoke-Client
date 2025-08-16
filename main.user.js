// ==UserScript==
// @name         Bespoke Client 
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

    let prefix = "";
    const baseUrl = "https://raw.githubusercontent.com/ZetaPossibly/Bespoke-Client/refs/heads/main/*";
    const getUrl = (path) => `${prefix}${baseUrl.replace("*", path)}`;

    prefix = "helpers/"
    const helpers = {
        jeeliz: getUrl("jeeliz/lib.js"),
    }

    prefix = "mods/"
    const mods = {
        lookout: getUrl("mods/lookout/main.js"),
        hmd: getUrl("mods/hmd/main.js"),
        chatFix: getUrl("mods/chatFix/main.js")
    }

    prefix = "data/"
    const data = {
        jeelizModels: {
            default: getUrl("jeeliz/models/default.json"),
            veryLight: getUrl("jeeliz/models/light.json"),
            wideAngles: getUrl("jeeliz/models/wideAngles.json"),
        }
    }

    window.bespokeClient = {
        data: data,
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
            alert("Fetch error:", err);
        }
    }

    async function loadScripts(scripts) {
        for (const [name, url] of Object.entries(scripts)) {
            await addCode(url);
        }
    }

    await loadScripts(helpers)
    await loadScripts(mods);

})();