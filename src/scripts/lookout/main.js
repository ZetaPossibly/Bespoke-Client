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

  const lookoutUi = new window.BUIM("Lookout", "lookout")
    .addItem("Rotational Sensitivity", "RotationalSensitivity", "number", 200)
    .addItem("Positional Sensitivity", "PositionalSensitivity", "number", 0.5)
    .addItem("Snappiness", "snappiness", "number", 5)
    .addItem("Angle Hold Radius", "deadzone", "number", 10)
    .addSubHeading("Level Horizon Assist Settings")
    .addItem("Enabled", "LHEnabled", "checkbox", true)
    .addItem("Max Angle", "LHAngle", "number", 45)
    .addItem("Override Resilience", "LHResilience", "number", 10)

  // ─── Silk instances ────────────────────────────────────────────────────────
  let pitchSilk = new Silk(0, { min: config.pitch.min, max: config.pitch.max });
  let yawSilk = new Silk(0, { min: config.yaw.min, max: config.yaw.max });
  let rollSilk = new Silk(0, { min: config.roll.min, max: config.roll.max });
  let leftRightSilk = new Silk(0, { min: config.leftRight.min, max: config.leftRight.max });
  //let forwardBackwardSilk = new Silk(0, { min: config.forwardBackward.min, max: config.forwardBackward.max });
  let upDownSilk = new Silk(0, { min: config.upDown.min, max: config.upDown.max });

  const rotationalAxes = [pitchSilk, yawSilk, rollSilk];
  const positionalAxes = [leftRightSilk, upDownSilk]; // forwardBackwardSilk

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

  const getDynamicMotion = function() {
        if (!lookoutUi.getBool("LHEnabled")) {
            return 0
        }
        // Customisation
        let targetCameraRot;
        let max_horizon_alignment_rot = parseFloat(lookoutUi.get("LHAngle"))
        let horizion_alignment_offset_multiplier = -0.75
        let horizon_alignement_lerp_alpha = 0.1

        const aroll = geofs.animation.values.aroll;
        const rot = clamp(aroll, -max_horizon_alignment_rot, max_horizon_alignment_rot) * horizion_alignment_offset_multiplier

        let calc = Cesium.Math.lerp(geofs.camera.currentDefinition.orientations.current[2], rot, horizon_alignement_lerp_alpha)

        return calc
    }

  // Reads smoothed Silk values and applies them to the camera.
  const applyTransformsToCamera = function () {
    let extraRoll = getDynamicMotion() / ((rollSilk.get()) / parseInt(lookoutUi.get("LHResilience"))) 
    geofs.camera.setRotation(yawSilk.get(), pitchSilk.get(), rollSilk.get()+extraRoll);

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
              //forwardBackwardSilk.setTarget(detectState.s);
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
