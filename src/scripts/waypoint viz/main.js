(function () {
  "use strict";

  const vizURL = typeof getUrl === "function" ? getUrl("scripts/waypoint viz/viz.js") : null;

  function getUIConfig(vizUi) {
    return {
      showPoints: vizUi.getBool("showPoints"),
      showLabels: vizUi.getBool("showLabels"),
      showPath: vizUi.getBool("showPath"),
      showHeadingArrows: vizUi.getBool("showHeadingArrows"),
      labelShowBackground: vizUi.getBool("labelShowBackground"),
      pointOutlineWidth: parseFloat(vizUi.get("pointOutlineWidth")) || 1,

      pathColorMode: vizUi.get("pathColorMode"),
      pathStyle: vizUi.get("pathStyle"),
      pathWidth: parseFloat(vizUi.get("pathWidth")) || 3,
      pathAlpha: parseFloat(vizUi.get("pathAlpha")) || 0.8,
      pathClampToGround: vizUi.getBool("pathClampToGround"),

      heightReference: vizUi.get("heightReference"),
      terrainOffsetMeters: parseFloat(vizUi.get("terrainOffsetMeters")) || 10,
    };
  }

  function applyConfig(viz, vizUi) {
    if (!viz) return;
    viz.configure(getUIConfig(vizUi));
  }


   // auto-syncing flight plan waypoints with GeoFS
  function handleAutoSync(viz, vizUi) {
    if (!viz) return;

    if (vizUi.isEnabled && vizUi.getBool("autoSync")) {
      viz.startAutoSync();
    } else {
      viz.stopAutoSync();
    }
  }

  function init() {
    if (typeof window.BUIM === "undefined") {
      console.error("[WaypointVisualizerUI] BUIM was not loaded.");
      return;
    }

    // Create BUIM Section
    const vizUi = new window.BUIM("Waypoint Visualizer", "wpviz");

    // Display Controls
    vizUi
      .addSubHeading("Display Controls")
      .addItem("Show Waypoint Points", "showPoints", "checkbox", true)
      .addItem("Show Waypoint Labels", "showLabels", "checkbox", true)
      .addItem("Show Flight Path", "showPath", "checkbox", true)
      .addItem("Show Heading Arrows", "showHeadingArrows", "checkbox", false)
      .addItem("Label Background", "labelShowBackground", "checkbox", true)
      .addItem("Point Outline Width", "pointOutlineWidth", "number", 1);

    // Path Settings
    vizUi
      .addSubHeading("Path Settings")
      .addDropdown(
        "Path Color Mode",
        "pathColorMode",
        {
          "By Waypoint Type": "byType",
          "Solid Color": "solid",
        },
        "byType",
      )
      .addDropdown(
        "Path Line Style",
        "pathStyle",
        {
          Solid: "solid",
          Dashed: "dashed",
        },
        "solid",
      )
      .addItem("Path Width (px)", "pathWidth", "number", 3)
      .addItem("Path Opacity (0-1)", "pathAlpha", "number", 0.8)
      .addItem("Clamp Path to Ground", "pathClampToGround", "checkbox", false);

    // Altitude and Terrain
    vizUi
      .addSubHeading("Altitude & Elevation")
      .addDropdown(
        "Height Reference",
        "heightReference",
        {
          "Absolute (MSL)": "absolute",
          "Relative to Ground": "relative",
          "Clamp to Ground": "clamp",
        },
        "absolute",
      )
      .addItem("Terrain Offset (m)", "terrainOffsetMeters", "number", 10)

    // Synchronization Settings
    vizUi
      .addSubHeading("Sync Settings")
      .addItem("Auto Sync Route", "autoSync", "checkbox", true)

    // Actions
    vizUi
      .addSubHeading("Actions")
      .addButton("Zoom to Route", () => {
        if (window.viz) {geofs.camera.set(4); window.viz.zoomTo(2.0);} // set to free cam then move
      })
      .addButton("Force Refresh Waypoints", () => {
        if (window.viz) {
          window.viz.setWaypoints(GeoFSWaypointVisualizer.getFlightPlanWaypoints());
        }
      });

    GeoFSWaypointVisualizer.fromGeoFS().then((viz) => {
      window.viz = viz;

      // Apply initial UI values & initial visibility state
      applyConfig(viz, vizUi);
      handleAutoSync(viz, vizUi);
      viz.setVisible(vizUi.isEnabled);

      // Register live-update listeners for settings
      const settingsKeys = [
        "showPoints",
        "showLabels",
        "showPath",
        "showHeadingArrows",
        "labelShowBackground",
        "pointOutlineWidth",
        "pathColorMode",
        "pathStyle",
        "pathWidth",
        "pathAlpha",
        "pathClampToGround",
        "heightReference",
        "terrainOffsetMeters",
      ];

      settingsKeys.forEach((key) => {
        vizUi.on(`${key}:change`, () => applyConfig(viz, vizUi));
      });

      // Handle Sync settings changes
      vizUi.on("autoSync:change", () => handleAutoSync(viz, vizUi));

      // Main Section Toggle (Enable/Disable Checkbox in Menu Header)
      vizUi.on("toggle", (enabled) => {
        viz.setVisible(enabled);
        if (enabled) {
          handleAutoSync(viz, vizUi);
        } else {
          viz.stopAutoSync();
        }
      });

      // Handle Section Reset Action
      vizUi.on("reset", () => {
        setTimeout(() => {
          applyConfig(viz, vizUi);
          handleAutoSync(viz, vizUi);
          viz.setVisible(vizUi.isEnabled);
        }, 100);
      });
    });
  }

  // Inject logic script if needed and bootstrap UI
  const bootstrap = async () => {
    if (typeof GeoFSWaypointVisualizer === "undefined" && vizURL && typeof addCode === "function") {
      await addCode(vizURL);
    }
    init();
  };

  setTimeout(bootstrap, 10);
})();
