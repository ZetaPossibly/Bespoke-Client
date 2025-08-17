const baseUrl = "https://raw.githubusercontent.com/ZetaPossibly/Bespoke-Client/refs/dev/main/src/*";
const getUrl = (path) => `${baseUrl.replace("*", path)}`;

const helpers = {
    jeeliz: getUrl("helpers/jeeliz/main.js"),
    buim: getUrl("helpers/buim/main.js")
}

const scripts = {
    lookout: getUrl("scripts/lookout/main.js"),
    chatFix: getUrl("scripts/chatFix/main.js")
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
        await addCode(url);
    }
}

const initClient = async function() {
    if (typeof geofs === 'undefined') {
        setTimeout(initClient, 1000);
        return;
    }
    alert("IMPORTANT NOTICE! This script(Bespoke Client) does headtracking using your webcam when in cockpit camera mode. You may be prompted to allow camera access when you enter cockpit camera mode, this is required for the head-tracking. This is done locally and is under development. It is not perfect. Ensure your face is well-lit or you will encounter poor accuracy and jittering. ")
    

    await loadScripts(helpers)

    //const uiManager = new window.BUIM("My Addon", "myAddon_");

    await loadScripts(scripts);
}

initClient()
