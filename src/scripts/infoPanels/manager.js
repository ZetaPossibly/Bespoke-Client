const panel_scripts = {
  flightDisplay: getUrl("scripts/infoPanels/flightDisplay.js"),
  fpsDisplay: getUrl("scripts/infoPanels/fps.js"),
  missileList: getUrl("scripts/infoPanels/missiles.js"),
};

function initUI() {
  // create UI elements
  const prefix = "infoPanels";
  const infoPanelsUi = new window.BUIM("Information Panels", prefix)
    .addItem("Flight Details", "FlightDisplay", "checkbox", true)
    .addItem("FPS Counter", "FpsCounter", "checkbox", true)
    .addItem("Missile List", "MissileList", "checkbox", false);

  function createPanels() {
    if (infoPanelsUi.getBool("FpsCounter")) createFPSDisplay();
    if (infoPanelsUi.getBool("MissileList")) createMissileList();
    if (infoPanelsUi.getBool("FlightDisplay")) flightDisplay.create();
  }

  // Toggling the whole menu
  infoPanelsUi.on("toggle", () => {
    if (!infoPanelsUi.isEnabled) {
      destroyFPSDisplay();
      deleteMissileList();
      flightDisplay.destroy();
    } else createPanels();
  });

  // Initial Game load
  if (infoPanelsUi.isEnabled) createPanels();

  // Individual setting toggles
  infoPanelsUi.on("FlightDisplay:change", (enabled) => {
    if (infoPanelsUi.isEnabled) {
      enabled ? flightDisplay.create(): flightDisplay.destroy()
    }
  });

  infoPanelsUi.on("FpsCounter:change", (enabled) => {
    if (infoPanelsUi.isEnabled) {
      enabled ? window.createFPSDisplay() : window.destroyFPSDisplay();
    }
  });

  infoPanelsUi.on("MissileList:change", (enabled) => {
    if (infoPanelsUi.isEnabled) {
      enabled ? createMissileList() : deleteMissileList();
    }
  });
}

setTimeout(async () => {
  await loadScripts(panel_scripts);
  initUI();
}, 10);
