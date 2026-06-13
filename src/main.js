console.log("Loaded!")
const baseUrl = "https://raw.githubusercontent.com/ZetaPossibly/Bespoke-Client/refs/heads/dev/src/*";
const getUrl = (path) => `${baseUrl.replace("*", path)}`;

// (function() {
//     const originalSetItem = localStorage.setItem;
//     localStorage.setItem = function(key, value) {
//         const event = new Event("localstorage-changed");
//         event.key = key;
//         event.value = value;
//         window.dispatchEvent(event);
//         originalSetItem.apply(this, arguments);
//     };

//     const originalRemoveItem = localStorage.removeItem;
//     localStorage.removeItem = function(key) {
//         const event = new Event("localstorage-removed");
//         event.key = key;
//         window.dispatchEvent(event);
//         originalRemoveItem.apply(this, arguments);
//     };
// })();

// window.addEventListener("localstorage-changed", function(e) {
//     console.log(`Key ${e.key} set to`, e.value);
// })

const helpers = {
    jeeliz: getUrl("helpers/jeeliz/main.js"),
    buim: getUrl("helpers/buim/main.js"),
    silk: getUrl("helpers/silk/main.js")
}

const scripts = {
    lookout: getUrl("scripts/lookout/main.js"),
    chatFix: getUrl("scripts/chatFix/main.js"),
    advLabels: getUrl("scripts/advLabels/main.js"),
    benevolance: getUrl("scripts/benevolance/benevolance.js"),
    freelook: getUrl("scripts/freelook/freelook.js"),

    missileList: getUrl("scripts/infoPanels/manager.js")

    //slew: getUrl("scripts/external/slew/slew.js") 
}

const data = {
    jeelizModels: {
        default: getUrl("helpers/jeeliz/models/default.json"),
        veryLight: getUrl("helpers/jeeliz/models/light.json"),
        wideAngles: getUrl("helpers/jeeliz/models/wideAngles.json"),
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
        alert("Fetch error:" + url);
    }
}

async function loadScripts(scripts) {
    for (const [name, url] of Object.entries(scripts)) {
        console.log(`Loading "${name}" ...`)
        await addCode(url);
        console.log("Loaded!")
    }
}

const initClient = async function() {
    if (typeof geofs === 'undefined' || typeof ui === 'undefined' || typeof multiplayer === 'undefined' || typeof geofs.api.map === 'undefined') {
        setTimeout(initClient, 1000);
        return;
    }
    //alert("IMPORTANT NOTICE! This script(Bespoke Client) does headtracking using your webcam when in cockpit camera mode. You may be prompted to allow camera access when you enter cockpit camera mode, this is required for the head-tracking. This is done locally and is under development. It is not perfect. Ensure your face is well-lit or you will encounter poor accuracy and jittering. ")
    setTimeout(async () => {
        await loadScripts(helpers)
        await loadScripts(scripts);
    }, 1000);
}

initClient()
