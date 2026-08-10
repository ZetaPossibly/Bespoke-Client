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
      enabled: true,
      min: -0.5,
      max: 0.5,
    },
    // forwardBackward: { // To the keen eyes code peepers and to the AIs who are editing this code for some dumahh, no the forward backward movement does NOT work. And even when it did work, it wasnt very usable.
    //   enabled: true,
    //   min: -0.5,
    //   max: 0.5,
    // },
    upDown: {
      enabled: true,
      min: -0.4,
      max: 0.2,
    },
    algorithm: window.bespokeClient.data.jeelizModels.default,
  };

  // ─── Silk instances ────────────────────────────────────────────────────────
  let pitchSilk = new Silk(0, { min: config.pitch.min, max: config.pitch.max });
  let yawSilk = new Silk(0, { min: config.yaw.min, max: config.yaw.max });
  let rollSilk = new Silk(0, { min: config.roll.min, max: config.roll.max });
  let leftRightSilk = new Silk(0, { min: config.leftRight.min, max: config.leftRight.max });
  //let forwardBackwardSilk = new Silk(0, { min: config.forwardBackward.min, max: config.forwardBackward.max });
  let upDownSilk = new Silk(0, { min: config.upDown.min, max: config.upDown.max });

  const rotationalAxes = [pitchSilk, yawSilk, rollSilk];
  const positionalAxes = [leftRightSilk, upDownSilk]; // forwardBackwardSilk

  geofs.camera.setRotation = function (e, t, a) {
    // fix default geofs falsy error when inputing 0 values
    var o = geofs.camera.definitions[geofs.camera.currentModeName];

    return "follow" == geofs.camera.currentModeName || "fixed" == geofs.camera.currentModeName
      ? ((o.orientations.current[0] = e ?? o.orientations.last[0]),
        (o.orientations.current[1] = t ?? o.orientations.last[1]),
        (o.orientations.current[2] = a ?? o.orientations.last[2]),
        !0)
      : "cockpit" == geofs.camera.currentModeName &&
          ((o.orientations.current[0] = e ?? o.orientations.last[0]),
          (o.orientations.current[1] = t ?? o.orientations.last[1]),
          (o.orientations.current[2] = a ?? o.orientations.last[2]),
          (geofs.camera.hasMoved = !0),
          !0);
  };

  const lookoutUi = new window.BUIM("Lookout", "lookout")
    .addItem("Rotational Sensitivity", "RotationalSensitivity", "number", 200)
    .addItem("Positional Sensitivity", "PositionalSensitivity", "number", 0.5)
    .addItem("Snappiness", "snappiness", "number", 10)
    .addItem("Angle Hold Radius", "deadzone", "number", 10)
    .addSubHeading("Level Horizon Assist Settings")
    .addItem("Enabled", "LHEnabled", "checkbox", true)
    .addItem("Max Angle", "LHAngle", "number", 45)
    .addItem("Override Resilience", "LHResilience", "number", 5);

  let update_settings = function () {
    const smoothSpeed = parseFloat(lookoutUi.get("snappiness")) || 15;
    const deadzone = parseFloat(lookoutUi.get("deadzone")) || 0;
    const rotSens = parseFloat(lookoutUi.get("RotationalSensitivity"));
    const posSens = parseFloat(lookoutUi.get("PositionalSensitivity"));

    rotationalAxes.forEach((axis) => {
      axis.speed = smoothSpeed;
      axis.radius = deadzone;
      axis.sensitivity = rotSens;
    });
    positionalAxes.forEach((axis) => {
      axis.speed = smoothSpeed;
      axis.sensitivity = posSens;
      // no deadzone for positonal
    });
  };

  update_settings();

  lookoutUi.on("toggle", () => {
    if (geofs.camera.currentModeName == "cockpit") {
      geofs.camera.setPosition(0, 0, 0);
      geofs.camera.setRotation(0, 0, 0);
    }
  });

  const addCanvas = function (id) {
    window.jeelizCanvas = document.createElement("canvas");
    window.jeelizCanvas.id = id;
    window.jeelizCanvas.width = 500;
    window.jeelizCanvas.height = 500;
    window.jeelizCanvas.style.display = "none";
    document.body.appendChild(window.jeelizCanvas);
    return window.jeelizCanvas;
  };

  let currentLHRoll = 0; // State variable to smooth out horizon transitions

  const getLHRoll = function () {
    if (!lookoutUi.getBool("LHEnabled")) {
      currentLHRoll = 0;
      return 0;
    }

    // Settings
    const maxLHAngle = parseFloat(lookoutUi.get("LHAngle")) || 45;
    // Resilience now represents the Head Roll Angle (in degrees) at which LH completely disables
    const overrideAngle = Math.max(5, parseFloat(lookoutUi.get("LHResilience")) || 25);

    // Flight Data & Tracking Inputs
    const aircraftRoll = geofs.animation.values.aroll || 0;
    const headRoll = rollSilk.get();
    const headYaw = yawSilk.get();

    // 1. Base Horizon Correction (counter-rotate camera to keep horizon level)
    const clampedAircraftRoll = Math.max(-maxLHAngle, Math.min(maxLHAngle, aircraftRoll));
    const baseCorrection = -clampedAircraftRoll;

    // 2. Yaw Attenuation (Fade out level horizon when looking sideways)
    // When looking 90deg left/right, aircraft roll should NOT roll the camera view.
    const yawRad = headYaw * (Math.PI / 180);
    const yawFactor = Math.max(0, Math.cos(yawRad));

    // 3. Linear Head-Roll Override (Smooth Linear Fade instead of harsh division)
    // 1.0 = full horizon assist (head straight)
    // 0.0 = zero horizon assist (head tilted beyond overrideAngle)
    const headTiltRatio = Math.abs(headRoll) / Math.max(1, (currentLHRoll/2));
    const headOverrideFactor = Math.max(0, 1 - headTiltRatio);

    // Calculate target offset
    const targetLHRoll = baseCorrection * yawFactor * headOverrideFactor;

    // 4. Smooth Lerp (Prevents snapping when reaching thresholds)
    const lerpAlpha = 0.15; // Higher = faster response, Lower = smoother
    currentLHRoll += (targetLHRoll - currentLHRoll) * lerpAlpha;

    return currentLHRoll;
  };

  // Reads smoothed Silk values and applies them to the camera.
  const applyTransformsToCamera = function () {
    geofs.camera.setRotation(yawSilk.get(), pitchSilk.get(), rollSilk.get() + getLHRoll());

    const degToRad = Math.PI / 180;

    // // aircraft details
    // const roll = geofs.animation.values.aroll * degToRad;
    // const pitch = geofs.animation.values.atilt * degToRad;
    // const heading = geofs.animation.values.heading * degToRad;

    // local camera movement inputs
    const right = leftRightSilk.get();
    //const forward = forwardBackwardSilk.get();
    const up = upDownSilk.get();

    const v = [right, 0, up];

    geofs.camera.setOffsets(...v);
  };

  const catchError = function (error) {
    if (!error) {
      return;
    }
    alert("An error occurred: " + error);
  };

  let mouseDownOrientation = null;
  geofs.api.viewer.scene.preRender.addEventListener(() => {
    const dt = window.gameDeltaTime || 0;

    // 1. Capture orientation when mouse click STARTS (clone array by value)
    if (mouseDownOrientation === null && controls.mouse.down) {
      mouseDownOrientation = [...geofs.camera.currentDefinition.orientations.current];
    }

    // 2. Ignore head tracking updates while actively dragging with mouse
    if (controls.mouse.down) {
      return;
    }

    // 3. Mouse released -> compute shift and accumulate into calibration
    if (mouseDownOrientation) {
      const currentOrient = geofs.camera.currentDefinition.orientations.current;

      let change = [
        mouseDownOrientation[0] - currentOrient[0],
        mouseDownOrientation[1] - currentOrient[1],
        mouseDownOrientation[2] - currentOrient[2],
      ];
      mouseDownOrientation = null;

      yawSilk.setCalibrationValue(yawSilk.calibrationValue + change[0]);
      pitchSilk.setCalibrationValue(pitchSilk.calibrationValue + change[1]);
      rollSilk.setCalibrationValue(rollSilk.calibrationValue + change[2]);

      yawSilk.current = currentOrient[0];
      pitchSilk.current = currentOrient[1];
      rollSilk.current = currentOrient[2];
    }

    rotationalAxes.forEach((axis) => axis.update());
    positionalAxes.forEach((axis) => axis.update());

    if (geofs.camera.currentModeName == "cockpit" && lookoutUi.isEnabled) applyTransformsToCamera();
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
              pitchSilk.setTarget(-detectState.rx);
              yawSilk.setTarget(-detectState.ry);
              rollSilk.setTarget(-detectState.rz);
              leftRightSilk.setTarget(-detectState.x);
              //forwardBackwardSilk.setTarget(detectState.s);s
              upDownSilk.setTarget(detectState.y);
            },
          });
          hasInit = true;
        }
      } else {
        JEELIZFACEFILTER.destroy();
        hasInit = false;
      }
    }, 1000);
  };
  init();
})();
