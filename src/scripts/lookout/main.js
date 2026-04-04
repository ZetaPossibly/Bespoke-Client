(function () {
  let config = {
    pitch: {
      enabled: true,
      min: -80,
      max: 170,
      calib: 0,
      sensitivity: 175,
    },
    yaw: {
      enabled: true,
      min: -160,
      max: 160,
      calib: 0,
      sensitivity: 200,
      deadzone: 5,
    },
    roll: {
      enabled: true,
      min: -100,
      max: 100,
      calib: 0,
      sensitivity: 250,
    },
    leftRight: {
      enabled: false,
      min: -0.5,
      max: 0.5,
      calib: 0,
      sensitivity: 5,
    },
    forwardBackward: {
      enabled: false,
      min: -0.5,
      max: 0.5,
      calib: 0,
      sensitivity: 5,
    },
    upDown: {
      enabled: false,
      min: -0.1,
      max: 0.2,
      calib: 0,
      sensitivity: 5,
    },
    algorithm: window.bespokeClient.data.jeelizModels.default,
  };

  const lookoutUi = new window.BUIM("Lookout", "lookout")
    .addItem("Rotational Sensitivity", "RotationalSensitivity", "number", 1)
    .addItem("Positional Sensitivity", "PositionalSensitivity", "number", 1)
    .addItem("Smoothening", "smoothening", "number", 15)
    .addItem("Deadzone", "deadzone", "number", 0)

  // ─── Silk instances ────────────────────────────────────────────────────────
  let pitchSilk          = new Silk(0, { min: config.pitch.min,           max: config.pitch.max });
  let yawSilk            = new Silk(0, { min: config.yaw.min,             max: config.yaw.max });
  let rollSilk           = new Silk(0, { min: config.roll.min,            max: config.roll.max });
  let leftRightSilk      = new Silk(0, { min: config.leftRight.min,       max: config.leftRight.max });
  let forwardBackwardSilk= new Silk(0, { min: config.forwardBackward.min, max: config.forwardBackward.max });
  let upDownSilk         = new Silk(0, { min: config.upDown.min,          max: config.upDown.max });

  const rotationalAxes = [pitchSilk, yawSilk, rollSilk];
  const positionalAxes = [leftRightSilk, forwardBackwardSilk, upDownSilk];

  let update_settings = function () {
    const smoothSpeed = parseFloat(lookoutUi.get("smoothening")) || 15;
    const deadzone    = parseFloat(lookoutUi.get("deadzone"))    || 0;

    rotationalAxes.forEach((axis) => {
      axis.speed    = smoothSpeed;
      axis.deadzone = deadzone;
    });
    positionalAxes.forEach((axis) => {
      axis.speed    = smoothSpeed;
      axis.deadzone = deadzone;
    });
  };

  update_settings();

  lookoutUi.on("toggle", () => {
    if (geofs.camera.currentModeName == "cockpit") {
      geofs.camera.setPosition(0, 0, 0);
      geofs.camera.setRotation(0, 0, 0);
    }
  });

  const clampToWithinBounds = function (value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  };

  const addCanvas = function (id) {
    const canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = 600;
    canvas.height = 600;
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    return canvas;
  };

  const transformFaceData = function (faceData, config) {
    if (config.enabled) {
      let transformed_value =
        faceData * config.sensitivity - config.calib;
      return transformed_value;
    }
    return config.default;
  };

  // Reads smoothed Silk values and applies them to the camera.
  const applyTransformsToCamera = function () {
    geofs.camera.setRotation(
      yawSilk.get(),
      pitchSilk.get(),
      rollSilk.get(),
    );
    geofs.camera.setPosition(
      leftRightSilk.get(),
      forwardBackwardSilk.get(),
      upDownSilk.get(),
    );
  };

  const catchError = function (error) {
    if (!error) {
      return;
    }
    alert("An error occurred: " + error);
  };

  // ─── Per-frame update loop ─────────────────────────────────────────────────
  geofs.api.viewer.scene.preRender.addEventListener(() => {
    const dt = window.gameDeltaTime || 0;

    rotationalAxes.forEach(axis => axis.update(dt));
    positionalAxes.forEach(axis => axis.update(dt));

    if (geofs.camera.currentModeName == "cockpit" && lookoutUi.isEnabled) applyTransformsToCamera();
  });

  setInterval(update_settings, 1000)

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
              if (geofs.camera.freeLookEnabled) {
                return;
              }

              const rotSens = parseFloat(lookoutUi.get("RotationalSensitivity"));
              const posSens = parseFloat(lookoutUi.get("PositionalSensitivity"));

              // Transform raw face data and push into Silk targets.
              // The silks are updated and applied to the camera in the preRender loop.
              pitchSilk.setTarget(
                transformFaceData(-detectState.rx * rotSens, config.pitch)
              );
              yawSilk.setTarget(
                transformFaceData(-detectState.ry * rotSens, config.yaw)
              );
              rollSilk.setTarget(
                transformFaceData(-detectState.rz * rotSens, config.roll)
              );
              leftRightSilk.setTarget(
                transformFaceData(-detectState.x * posSens, config.leftRight)
              );
              forwardBackwardSilk.setTarget(
                transformFaceData(detectState.s * posSens, config.forwardBackward)
              );
              upDownSilk.setTarget(
                transformFaceData(detectState.y * posSens, config.upDown)
              );

              geofs.camera.freeLookBase = [yawSilk.get(), pitchSilk.get()];
            },
          });
          hasInit = true;
          console.log("Done!");
        }
      } else {
        JEELIZFACEFILTER.destroy();
        hasInit = false;
      }
    }, 1000);
  };
  init();
})();