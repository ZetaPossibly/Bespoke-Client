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

(function() {
    "use strict";
    async function loadScript(url, place = "body") {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const scriptText = await response.text();

            const scriptEl = document.createElement("script");
            scriptEl.textContent = scriptText;

            if (place === "head") {
                document.head.appendChild(scriptEl);
            } else {
                document.body.appendChild(scriptEl);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }

    const baseUrl = "https://raw.githubusercontent.com/zetascripts/eschaton-client/main/";

    const scripts = {
        lookout: ""
    }



})();