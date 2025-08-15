const config = {
  pitch: {
    enabled: true,
    min: -80,
    max: 170,
    default: 0,
    sensitivity: 175,
  },
  yaw: {
    enabled: true,
    min: -160,
    max: 160,
    default: 0,
    sensitivity: 250,
  },
  roll: {
    enabled: true,
    min: -100,
    max: 100,
    default: 0,
    sensitivity: 200,
  },
  leftRight: {
    enabled: true,
    min: -0.5,
    max: 0.5,
    default: 0,
    sensitivity: 1,
  },
  forwardBackward: {
    enabled: true,
    min: -0.5,
    max: 0.5,
    default: 0,
    sensitivity: 0,
  },
  upDown: {
    enabled: true,
    min: -0.1,
    max: 0.2,
    default: 0,
    sensitivity: 1.25,
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
    ? clampToWithinBounds(faceData * config.sensitivity, config.min, config.max)
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

const init = function () {
  JEELIZFACEFILTER.init({
    canvasId: addCanvas("jeeFaceFilterCanvas").id,
    NNCPath: config.algorithm,
    maxFacesDetected: 1,
    callbackReady: catchError,
    callbackTrack: function (detectState) {
      const transformedFaceData = {
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
        confidence: detectState.detected,
      };

      applyTransformsToCamera(transformedFaceData);
    },
  });
};
init();

// Add stabalisation bozo