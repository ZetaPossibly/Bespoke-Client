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
      sensitivity: 125,
    },
    leftRight: {
      enabled: true,
      min: -0.5,
      max: 0.5,
      calib: 0,
      sensitivity: 5,
    },
    forwardBackward: {
      enabled: true,
      min: -0.5,
      max: 0.5,
      calib: 0,
      sensitivity: 15,
    },
    upDown: {
      enabled: true,
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
    .addItem("Snappiness", "snappiness", "number", 5)
    .addItem("Deadzone", "deadzone", "number", 1)

  // ─── Silk instances ────────────────────────────────────────────────────────
  let pitchSilk = new Silk(0, { min: config.pitch.min, max: config.pitch.max });
  let yawSilk = new Silk(0, { min: config.yaw.min, max: config.yaw.max });
  let rollSilk = new Silk(0, { min: config.roll.min, max: config.roll.max });
  let leftRightSilk = new Silk(0, { min: config.leftRight.min, max: config.leftRight.max });
  let forwardBackwardSilk = new Silk(0, { min: config.forwardBackward.min, max: config.forwardBackward.max });
  let upDownSilk = new Silk(0, { min: config.upDown.min, max: config.upDown.max });

  const rotationalAxes = [pitchSilk, yawSilk, rollSilk];
  const positionalAxes = [leftRightSilk, forwardBackwardSilk, upDownSilk];

  let calibrate = function () {
    console.log("Calibrating")
    rotationalAxes.forEach((axis) => {
      axis.calibrate();
    });
    positionalAxes.forEach((axis) => {
      axis.calibrate();
    });
  };
  lookoutUi.addButton("Calibrate", calibrate);

  let update_settings = function () {
    const smoothSpeed = parseFloat(lookoutUi.get("snappiness")) || 15;
    const deadzone = parseFloat(lookoutUi.get("deadzone")) || 0;

    rotationalAxes.forEach((axis) => {
      axis.speed = smoothSpeed;
      axis.radius = deadzone;
    });
    positionalAxes.forEach((axis) => {
      axis.speed = smoothSpeed;
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
    const canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = 600;
    canvas.height = 600;
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    return canvas;
  };

  // Reads smoothed Silk values and applies them to the camera.
  window.applyTransformsToCamera = function () {
    geofs.camera.setRotation(yawSilk.get(), pitchSilk.get(), rollSilk.get());

    let rawPositionVector = [leftRightSilk.get(), forwardBackwardSilk.get(), upDownSilk.get()]
    const toRotate = 0.0174532925 * geofs.animation.values.aroll
    const rotatedVector = V3.rotate(rawPositionVector, [0, 1, 0], toRotate)
    geofs.camera.setPosition(rotatedVector[0], rotatedVector[1], rotatedVector[2]);
  };

  const catchError = function (error) {
    if (!error) {
      return;
    }
    alert("An error occurred: " + error);
  };

  geofs.api.viewer.scene.preRender.addEventListener(() => {
    const dt = window.gameDeltaTime || 0;

    rotationalAxes.forEach((axis) => axis.update(dt));
    positionalAxes.forEach((axis) => axis.update(dt));

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
              if (geofs.camera.freeLookEnabled) {
                return;
              }

              const rotSens = parseFloat(lookoutUi.get("RotationalSensitivity"));
              const posSens = parseFloat(lookoutUi.get("PositionalSensitivity"));

              pitchSilk.setTarget(-detectState.rx * rotSens);
              yawSilk.setTarget(-detectState.ry * rotSens);
              rollSilk.setTarget(-detectState.rz * rotSens);
              leftRightSilk.setTarget(-detectState.x * posSens);
              forwardBackwardSilk.setTarget(detectState.s * posSens);
              upDownSilk.setTarget(detectState.y * posSens);

              geofs.camera.freeLookBase = [yawSilk.get(), pitchSilk.get()];
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
