const baseUrl = "https://raw.githubusercontent.com/ZetaPossibly/Bespoke-Client/refs/heads/main/src/*";
const getUrl = (path) => `${baseUrl.replace("*", path)}`;

const helpers = {
    jeeliz: getUrl("helpers/jeeliz/lib.js"),
}

const scripts = {
    lookout: getUrl("scripts/lookout/main.js"),
    //hmd: getUrl("scripts/hmd/main.js"),
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
