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
    forwardBackward: {
      enabled: true,
      min: -0.5,
      max: 0.5,
    },
    upDown: {
      enabled: true,
      min: -0.2,
      max: 0.2,
    },
    algorithm: window.bespokeClient.data.jeelizModels.default,
  };

  const lookoutUi = new window.BUIM("Lookout", "lookout")
    .addItem("Rotational Sensitivity", "RotationalSensitivity", "number", 250)
    .addItem("Positional Sensitivity", "PositionalSensitivity", "number", 100)
    .addItem("Snappiness", "snappiness", "number", 10)
    .addItem("Deadzone", "deadzone", "number", 5);

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
    console.log("Calibrating");
    ui.notification.show("Calibrating in 3 seconds, look at the center of your screen.");
    rotationalAxes.forEach((axis) => {
      setTimeout(axis.calibrate, 3000);
    });
    positionalAxes.forEach((axis) => {
      setTimeout(axis.calibrate, 3000);
    });
  };
  lookoutUi.addButton("Calibrate", calibrate);

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
    const canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = 500;
    canvas.height = 500;
    canvas.style.display = "none";
    document.body.appendChild(canvas);
    return canvas;
  };

  // Reads smoothed Silk values and applies them to the camera.
  const applyTransformsToCamera = function () {
    geofs.camera.setRotation(yawSilk.get(), pitchSilk.get(), rollSilk.get());

    const degToRad = Math.PI / 180;

    const degToRad = Math.PI / 180;

    // Aircraft orientation
    const roll = geofs.animation.values.aroll * degToRad;
    const pitch = geofs.animation.values.atilt * degToRad;
    const heading = geofs.animation.values.heading * degToRad;

    // Local camera inputs (aircraft space)
    const right = leftRightSilk.get();
    const forward = forwardBackwardSilk.get();
    const up = upDownSilk.get();

    // --- Build rotation matrices ---

    // Yaw (heading) — rotates around the UP axis
    const cosH = Math.cos(heading),
      sinH = Math.sin(heading);
    const Ry = [
      [cosH, 0, sinH],
      [0, 1, 0],
      [-sinH, 0, cosH],
    ];

    // Pitch (tilt) — rotates around the RIGHT axis
    const cosP = Math.cos(pitch),
      sinP = Math.sin(pitch);
    const Rx = [
      [1, 0, 0],
      [0, cosP, -sinP],
      [0, sinP, cosP],
    ];

    // Roll — rotates around the FORWARD axis
    const cosR = Math.cos(roll),
      sinR = Math.sin(roll);
    const Rz = [
      [cosR, -sinR, 0],
      [sinR, cosR, 0],
      [0, 0, 1],
    ];

    // --- Combine: world = Ry * Rx * Rz (yaw → pitch → roll) ---
    function mulMat(A, B) {
      return A.map((row) => [0, 1, 2].map((j) => row.reduce((sum, _, k) => sum + A[row.indexOf(row[k])][k] * B[k][j], 0)));
    }
    // Cleaner mat multiply:
    function matMul(A, B) {
      const R = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) R[i][j] += A[i][k] * B[k][j];
      return R;
    }

    const R = matMul(matMul(Ry, Rx), Rz);

    // --- Apply to local vector ---
    const localVec = [right, forward, up];
    const world = R.map((row) => row.reduce((sum, val, i) => sum + val * localVec[i], 0));

    geofs.camera.setPosition(world[0], world[1], world[2]);
  };

  const catchError = function (error) {
    if (!error) {
      return;
    }
    alert("An error occurred: " + error);
  };

  geofs.api.viewer.scene.preRender.addEventListener(() => {
    const dt = window.gameDeltaTime || 0;

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
              forwardBackwardSilk.setTarget(detectState.s);
              console.log(detectState);
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
