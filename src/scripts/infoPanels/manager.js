const panel_scripts = {
    flightDisplay: getUrl("scripts/infoPanels/flightDisplay.js"),
    fpsDisplay: getUrl("scripts/infoPanels/fps.js"),
    missileList: getUrl("scripts/infoPanels/missiles.js")
}

await loadScripts(panel_scripts)

const prefix = "infoPanels";
const infoPanelsUi = new window.BUIM("Information Panels", prefix)
    .addItem("Flight Details", "FlightDisplay", "checkbox", true)
    .addItem("FPS Counter", "FpsCounter", "checkbox", true)
    .addItem("Missile List", "MissileList", "checkbox", true);


function createPanels() {
    if (infoPanelsUi.getBool("FpsCounter")) createFPSDisplay()
    if (infoPanelsUi.getBool("MissileList")) createMissileList();
    if (infoPanelsUi.getBool("FlightDisplay")) flightDisplay.create()
}

// Toggling the whole menu
 infoPanelsUi.on("toggle", () => {
    if (!infoPanelsUi.isEnabled) {
        destroyFPSDisplay()
        deleteMissileList()
        flightDisplay.destroy()
    } else createPanels()
})

// Initial Game load
if (infoPanelsUi.isEnabled) createPanels()

// Individual setting toggles
infoPanelsUi.on("FlightDisplay:change", (enabled) => {
    if (infoPanelsUi.isEnabled) {
        enabled ? flightDisplay.destroy() : flightDisplay.create()
    }
})

infoPanelsUi.on("FpsCounter:change", (enabled) => {
    if (infoPanelsUi.isEnabled) {
        enabled ? createFPSDisplay() : destroyFPSDisplay()
    }
})

infoPanelsUi.on("MissileList:change", (enabled) => {
    if (infoPanelsUi.isEnabled) {
        enabled ? createMissileList() : deleteMissileList()
    }
})