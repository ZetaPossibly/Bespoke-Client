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
        if (config.enabled) {
            let transformed_value = clampToWithinBounds(
                faceData * config.sensitivity * parseFloat(localStorage.getItem("lookoutSensitivity")),
                config.min,
                config.max
            ) + config.default - config.calib;
            if (Math.abs(transformed_value - config.default) < config.deadzone) {
                transformed_value = config.default;
            }
            return transformed_value;
        } 
        return config.default;
    };

    const applyTransformsToCamera = function (data) {
        geofs.camera.setRotation(
            transformFaceData(data.rotation.yaw, config.yaw),
            transformFaceData(data.rotation.pitch, config.pitch),
            transformFaceData(data.rotation.roll, config.roll)
        );
        geofs.camera.setPosition(
            transformFaceData(data.position.leftRight, config.leftRight),
            transformFaceData(data.position.forwardBackward, config.forwardBackward),
            transformFaceData(data.position.upDown, config.upDown)
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
                                    pitch: -detectState.rx,
                                    yaw: -detectState.ry,
                                    roll: -detectState.rz,
                                },
                                position: {
                                    leftRight: -detectState.x,
                                    forwardBackward: detectState.s,
                                    upDown: detectState.y,
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

    window.calibrateLookout = function () {
        console.log("Calibrating!");

        config.pitch.calib = -transformedFaceData.rotation.pitch
        config.yaw.calib = -transformedFaceData.rotation.yaw
        config.roll.calib = -transformedFaceData.rotation.roll
        config.leftRight.calib = -transformedFaceData.position.leftRight
        config.forwardBackward.calib = -transformedFaceData.position.forwardBackward
        config.upDown.calib = -transformedFaceData.position.upDown

        console.log("Config after calibration:", JSON.stringify(config, null, 2));
        console.log("TransformedFaceData reset:", JSON.stringify(transformedFaceData, null, 2));
    };

    lookoutUi.addButton("Calibrate", "calibrateLookout");
    lookoutUi.addItem("Sensitivity", "Sensitivity", "input", 0, 1)
})()
