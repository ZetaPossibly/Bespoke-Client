const baseUrl = "https://raw.githubusercontent.com/ZetaPossibly/Bespoke-Client/refs/heads/main/*";
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