(function () {
    let config = {
        pitch: {
            enabled: true,
            min: -80,
            max: 170,
            default: 0,
            calib: 0,
            sensitivity: 175,
            deadzone: 0
        },
        yaw: {
            enabled: true,
            min: -160,
            max: 160,
            default: 0,
            calib: 0,
            sensitivity: 200,
            deadzone: 5
        },
        roll: {
            enabled: true,
            min: -100,
            max: 100,
            default: 0,
            calib: 0,
            sensitivity: 200,
            deadzone: 5
        },
        leftRight: {
            enabled: false,
            min: -0.5,
            max: 0.5,
            default: 0,
            calib: 0,
            sensitivity: 1,
            deadzone: 5
        },
        forwardBackward: {
            enabled: false,
            min: -0.5,
            max: 0.5,
            default: 0,
            calib: 0,
            sensitivity: 0,
            deadzone: 0
        },
        upDown: {
            enabled: false,
            min: -0.1,
            max: 0.2,
            default: 0,
            calib: 0,
            sensitivity: 1.25,
            deadzone: 1
        },
        algorithm: window.bespokeClient.data.jeelizModels.default,
    };

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
        return config.enabled
            ? clampToWithinBounds(
                faceData * config.sensitivity * parseFloat(localStorage.getItem("lookoutSensitivity")),
                config.min,
                config.max
            ) + config.default - config.calib
            : config.default; // return the resting, "default" values, if not enabled
    };

    const applyTransformsToCamera = function (data) {
        geofs.camera.setRotation(
            data.rotation.yaw,
            data.rotation.pitch,
            data.rotation.roll
        );
        geofs.camera.setPosition(
            data.position.leftRight,
            data.position.forwardBackward,
            data.position.upDown
        );
    };

    const catchError = function (error) {
        if (!error) {
            return;
        }
        alert("An error occurred: " + error);
    };

    let transformedFaceData = {
        rotation: {
            pitch: 0,
            yaw: 0,
            roll: 0,
        },
        position: {
            leftRight: 0,
            forwardBackward: 0,
            upDown: 0,
        },
    };

    const init = function () {
        let hasInit = false;
        setInterval(function () {
            if (geofs.camera.currentModeName == "cockpit" && localStorage.getItem("lookoutEnabled") === "true") {
                if (!hasInit) {
                    console.log("Initialising Jeeliz...")
                    JEELIZFACEFILTER.init({
                        canvasId: addCanvas("jeeFaceFilterCanvas").id,
                        NNCPath: config.algorithm,
                        maxFacesDetected: 1,
                        callbackReady: catchError,
                        callbackTrack: function (detectState) {
                            if (geofs.camera.freeLookEnabled) {
                                return;
                            }
                            transformedFaceData = {
                                rotation: {
                                    pitch: transformFaceData(-detectState.rx, config.pitch),
                                    yaw: transformFaceData(-detectState.ry, config.yaw),
                                    roll: transformFaceData(-detectState.rz, config.roll),
                                },
                                position: {
                                    leftRight: transformFaceData(-detectState.x, config.leftRight),
                                    forwardBackward: transformFaceData(
                                        detectState.s,
                                        config.forwardBackward
                                    ),
                                    upDown: transformFaceData(detectState.y, config.upDown),
                                },
                            };
                            geofs.camera.freeLookBase = [
                                transformedFaceData.rotation.yaw,
                                transformedFaceData.rotation.pitch,
                            ]

                            applyTransformsToCamera(transformedFaceData);
                        },
                    });
                    // JEELIZFACEFILTER.set_stabilizationSettings({
                    //   translationFactorRange: [0.01, 0.02],
                    //   rotationFactorRange: [0.05, 0.1],
                    //   qualityFactorRange: [0.9, 0.98],
                    //   alphaRange: [0.05, 1.0]
                    // });
                    hasInit = true;
                    console.log("Done!")
                }
            } else {
                JEELIZFACEFILTER.destroy();
                hasInit = false;
            }
        }, 1000);
    };
    init();

    const lookoutUi = new window.BUIM("Lookout", "lookout");

    // window.calibrateLookout = function() {
    //   console.log("Calibrating!")
    //   console.log("Before calibration:", JSON.stringify(config, null, 2));
    //   console.log("FaceData snapshot:", JSON.stringify(transformedFaceData, null, 2));


    //   config.pitch.default = -transformedFaceData.rotation.pitch/2;
    //   config.yaw.default = -transformedFaceData.rotation.yaw/2;
    //   config.roll.default = -transformedFaceData.rotation.roll/2;
    //   config.leftRight.default = -transformedFaceData.position.leftRight/2;
    //   config.forwardBackward.default = -transformedFaceData.position.forwardBackward/2;
    //   config.upDown.default = -transformedFaceData.position.upDown/2;

    //   console.log("After calibration:", JSON.stringify(config, null, 2));

    // }

    window.calibrateLookout = function () {
        console.log("Calibrating!");

        config.pitch.calib = -transformedFaceData.rotation.pitch + config.pitch.calib;
        config.yaw.calib = -transformedFaceData.rotation.yaw + config.yaw.calib;
        config.roll.calib = -transformedFaceData.rotation.roll + config.roll.calib;
        config.leftRight.calib = -transformedFaceData.position.leftRight + config.leftRight.calib;
        config.forwardBackward.calib = -transformedFaceData.position.forwardBackward + config.forwardBackward.calib;
        config.upDown.calib = -transformedFaceData.position.upDown + config.upDown.calib;

        console.log("Config after calibration:", JSON.stringify(config, null, 2));
        console.log("TransformedFaceData reset:", JSON.stringify(transformedFaceData, null, 2));
    };

    lookoutUi.addButton("Calibrate", "calibrateLookout");
    lookoutUi.addItem("Sensitivity", "Sensitivity", "input", 0, 1)
})()
