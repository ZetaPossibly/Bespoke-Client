(function () {
  let config = {
    pitch: {
      enabled: true,
      min: -80,
      max: 170,
    },
    yaw: {
      enabled: true,
      min: -160,
      max: 160,
    },
    roll: {
      enabled: true,
      min: -100,
      max: 100,
    },
    leftRight: {
      enabled: false,
      min: -0.5,
      max: 0.5,
    },
    forwardBackward: {
      enabled: false,
      min: -0.5,
      max: 0.5,
    },
    upDown: {
      enabled: false,
      min: -0.1,
      max: 0.2,
    },
    algorithm: window.bespokeClient.data.jeelizModels.default,
  };

  console.log("[lookout] config:", JSON.parse(JSON.stringify(config)));

  const lookoutUi = new window.BUIM("Lookout", "lookout")
    .addItem("Rotational Sensitivity", "RotationalSensitivity", "number", 57)  // was 2
    .addItem("Snappiness", "snappiness", "number", 10)
    .addItem("Deadzone", "deadzone", "number", 3);  // now 3 degrees, which makes sense

  // ─── Silk instances ────────────────────────────────────────────────────────
  console.log("[lookout] lookoutUi created. Initial values:", {
    RotationalSensitivity: lookoutUi.get("RotationalSensitivity"),
    snappiness: lookoutUi.get("snappiness"),
    deadzone: lookoutUi.get("deadzone"),
    enabled: lookoutUi.isEnabled,
  });

  let pitchSilk = new Silk(0, { min: config.pitch.min, max: config.pitch.max });
  let yawSilk = new Silk(0, { min: config.yaw.min, max: config.yaw.max });
  let rollSilk = new Silk(0, { min: config.roll.min, max: config.roll.max });
  //   let leftRightSilk = new Silk(0, { min: config.leftRight.min, max: config.leftRight.max });
  //   let forwardBackwardSilk = new Silk(0, { min: config.forwardBackward.min, max: config.forwardBackward.max });
  //   let upDownSilk = new Silk(0, { min: config.upDown.min, max: config.upDown.max });

  const rotationalAxes = [pitchSilk, yawSilk, rollSilk];
  //const positionalAxes = [leftRightSilk, forwardBackwardSilk, upDownSilk];

  let calibrate = function () {
    console.log("Calibrating");
    ui.notification.show("Calibrating in 3 seconds, look at the center of your screen.");
    rotationalAxes.forEach((axis, idx) => {
      console.log("[lookout] scheduling calibrate for axis", idx, axis);
      setTimeout(function () {
        try {
          console.log("[lookout] running calibrate for axis", idx);
          axis.calibrate();
        } catch (e) {
          console.error("[lookout] calibrate error axis", idx, e);
        }
      }, 3000);
    });
    // positionalAxes.forEach((axis) => {
    //   axis.calibrate();
    // });
  };
  lookoutUi.addButton("Calibrate", calibrate);

  let update_settings = function () {
    const smoothSpeed = parseFloat(lookoutUi.get("snappiness")) || 15;
    const deadzone = parseFloat(lookoutUi.get("deadzone")) || 0;
    const rotSens = parseFloat(lookoutUi.get("RotationalSensitivity"));
    //const posSens = parseFloat(lookoutUi.get("PositionalSensitivity"));

    console.log("[lookout] update_settings:", { smoothSpeed, deadzone, rotSens });
    rotationalAxes.forEach((axis, idx) => {
      console.log("[lookout] before axis settings", idx, { speed: axis.speed, radius: axis.radius, sensitivity: axis.sensitivity });
      axis.speed = smoothSpeed;
      axis.radius = deadzone;
      axis.sensitivity = rotSens
      console.log("[lookout] after axis settings", idx, { speed: axis.speed, radius: axis.radius, sensitivity: axis.sensitivity });
    });
    // positionalAxes.forEach((axis) => {
    //   axis.speed = smoothSpeed;
    //.  axis.sensitivity = posSens
    //   // no deadzone for positonal
    // });
  };

  update_settings();

  lookoutUi.on("toggle", () => {
    console.log("[lookout] toggle event. camera mode:", geofs.camera.currentModeName, "lookout enabled:", lookoutUi.isEnabled);
    if (geofs.camera.currentModeName == "cockpit") {
      geofs.camera.setPosition(0, 0, 0);
      geofs.camera.lookAround(0, 0, 0);
      console.log("[lookout] camera reset to center for cockpit mode");
    }
  });

  const addCanvas = function (id) {
    const canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = 600;
    canvas.height = 600;
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    console.log("[lookout] added canvas", id, "(w,h)", canvas.width, canvas.height);
    return canvas;
  };

  // Reads smoothed Silk values and applies them to the camera.
  const applyTransformsToCamera = function () {
    const yawVal = yawSilk.get();
    const pitchVal = pitchSilk.get();
    const rollVal = rollSilk.get();
    console.log("[lookout] applyTransformsToCamera() values:", { yaw: yawVal, pitch: pitchVal, roll: rollVal });
    try {
      geofs.camera.lookAround(yawVal, pitchVal, rollVal);
    } catch (e) {
      console.error("[lookout] geofs.camera.lookAround error", e, { yawVal, pitchVal, rollVal });
    }

    // let rawPositionVector = [leftRightSilk.get(), forwardBackwardSilk.get(), upDownSilk.get()]
    // const toRotate = 0.0174532925 * geofs.animation.values.aroll
    // const rotatedVector = V3.rotate(rawPositionVector, [0, 0, 1], -toRotate)
    // geofs.camera.setPosition(rotatedVector[0], rotatedVector[1], rotatedVector[2]);
  };

  const catchError = function (error) {
    if (!error) {
      return;
    }
    console.error("[lookout] catchError:", error);
    try {
      alert("An error occurred: " + error);
    } catch (e) {
      console.error("[lookout] alert failed:", e);
    }
  };

  geofs.api.viewer.scene.preRender.addEventListener(() => {
    const dt = window.gameDeltaTime || 0;

    // Heavy logging each frame — intentional for debugging
    try {
      const before = rotationalAxes.map((a) => ({ value: a.get(), speed: a.speed, radius: a.radius, sensitivity: a.sensitivity }));
      console.log("[lookout] preRender dt:", dt, "rotational before:", before);
    } catch (e) {
      console.error("[lookout] error reading rotationalAxes before update:", e);
    }

    rotationalAxes.forEach((axis, idx) => {
      try {
        axis.update(dt);
      } catch (e) {
        console.error("[lookout] axis.update error idx", idx, e);
      }
    });
    //positionalAxes.forEach((axis) => axis.update(dt));

    try {
      const after = rotationalAxes.map((a) => ({ value: a.get(), speed: a.speed }));
      console.log("[lookout] post-update rotational values:", after);
    } catch (e) {
      console.error("[lookout] error reading rotationalAxes after update:", e);
    }

    if (geofs.camera.currentModeName == "cockpit" && lookoutUi.isEnabled) {
      console.log("[lookout] applying transforms to camera (cockpit + enabled)");
      applyTransformsToCamera();
    }
  });

  setInterval(update_settings, 1000);

  const init = function () {
    let hasInit = false;
    setInterval(function () {
      if (geofs.camera.currentModeName == "cockpit" && lookoutUi.isEnabled) {
        if (!hasInit) {
            console.log("Initialising Jeeliz...");
            JEELIZFACEFILTER.init({
            canvasId: addCanvas("jeeFaceFilterCanvas").id,
            NNCPath: config.algorithm,
            maxFacesDetected: 1,
            callbackReady: catchError,
            callbackTrack: function (detectState) {
                console.log("[lookout] JEELIZ callbackTrack detectState:", JSON.parse(JSON.stringify(detectState)));
                try {
                  pitchSilk.setTarget(-detectState.rx);
                  yawSilk.setTarget(-detectState.ry);
                  rollSilk.setTarget(-detectState.rz);
                } catch (e) {
                  console.error("[lookout] error setting silk targets:", e, detectState);
                }
              //leftRightSilk.setTarget(-detectState.x);
              //forwardBackwardSilk.setTarget(detectState.s);
              //upDownSilk.setTarget(detectState.y);
            },
          });
          hasInit = true;
        }
      } else {
          try {
            console.log("[lookout] destroying JEELIZFACEFILTER (if exists)");
            JEELIZFACEFILTER.destroy();
          } catch (e) {
            console.warn("[lookout] JEELIZFACEFILTER.destroy() threw:", e);
          }
          hasInit = false;
      }
    }, 1000);
  };
  init();
})();
