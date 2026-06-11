// ==UserScript==
// @name         Bespoke Client
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A bespoke client for GeoFS, by Zeta
// @author       Zeta
// @match        https://*.geo-fs.com/geofs.php?v=*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

// Capabilities:
// - "Advanced Labels" improve in-game nametags + Remove Foos.
// - "Lookout" Headtracking for immersion in cockpit cam.
// - "Benevolance" Dark theme + Remove Foos from map + Map Style Customisation 
// - "chatFix" wysiwyg, fixes the chat. Re-implements the "t" keybind to send chat messages (also customisable!)
// - "Freelook" Quickly orbit your camera 

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

// >> Loads in the most up-to-date version of the client <<
await loadClient() 
