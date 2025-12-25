let betterEnabled = true;
let smoothingConfig = {
  rotationSpring: {
    springStrength: 0.2,
    damping: 0.7,
    deadzone: 0.01,
    maxSpeed: 20,
    velocitySmoothing: 0.6,
  },
  positionSpring: {
    springStrength: 0.01,
    damping: 0.7,
    deadzone: 0.01,
    maxSpeed: 20,
    velocitySmoothing: 0.6,
  },
  currentStabilizedData: {
    rotation: { yaw: 0, pitch: 0, roll: 0 },
    position: { x: 0, y: 0, z: 0 },
  },

  currentVelocity: {
    rotation: { yaw: 0, pitch: 0, roll: 0 },
    position: { x: 0, y: 0, z: 0 },
  },

  smoothedVelocity: {
    rotation: { yaw: 0, pitch: 0, roll: 0 },
    position: { x: 0, y: 0, z: 0 },
  },
  prevTransData: [],
};

function closestPointOnLineLLA(targetLLA, cameraLLA, distance = 12) {
  const R = 6378137; // WGS84 Earth radius in meters

  // Convert LLA to ECEF
  function llaToECEF(lat, lon, alt) {
    lat = (lat * Math.PI) / 180;
    lon = (lon * Math.PI) / 180;
    const a = 6378137.0;
    const e = 8.1819190842622e-2;

    const N = a / Math.sqrt(1 - e * e * Math.sin(lat) * Math.sin(lat));

    const x = (N + alt) * Math.cos(lat) * Math.cos(lon);
    const y = (N + alt) * Math.cos(lat) * Math.sin(lon);
    const z = ((1 - e * e) * N + alt) * Math.sin(lat);

    return [x, y, z];
  }

  // Convert ECEF to LLA
  function ecefToLLA(x, y, z) {
    const a = 6378137.0;
    const e = 8.1819190842622e-2;

    const b = Math.sqrt(a * a * (1 - e * e));
    const ep = Math.sqrt((a * a - b * b) / (b * b));
    const p = Math.sqrt(x * x + y * y);
    const th = Math.atan2(a * z, b * p);

    const lon = Math.atan2(y, x);
    const lat = Math.atan2(
      z + ep * ep * b * Math.pow(Math.sin(th), 3),
      p - e * e * a * Math.pow(Math.cos(th), 3)
    );
    const N = a / Math.sqrt(1 - e * e * Math.sin(lat) * Math.sin(lat));
    const alt = p / Math.cos(lat) - N;

    return [(lat * 180) / Math.PI, (lon * 180) / Math.PI, alt];
  }

  // Vector ops
  function subtract(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  function normalize(v) {
    const mag = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
    return [v[0] / mag, v[1] / mag, v[2] / mag];
  }

  function scale(v, s) {
    return [v[0] * s, v[1] * s, v[2] * s];
  }

  const ecefTarget = llaToECEF(...targetLLA);
  const ecefCam = llaToECEF(...cameraLLA);
  const dir = normalize(subtract(ecefCam, ecefTarget));
  const newECEF = add(ecefTarget, scale(dir, distance));
  let newLLA = ecefToLLA(...newECEF);
  //  newLLA[2] -= 0.5

  return newLLA;
}

function getHTR(lastLLA, currentLLA) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const [lat1, lon1, alt1] = lastLLA.map(toRad);
  const [lat2, lon2, alt2] = currentLLA.map(toRad);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const dAlt = currentLLA[2] - lastLLA[2];

  // Approx flat-Earth distance for small delta
  const R = 6371000;
  const x = Math.cos((lat1 + lat2) / 2) * dLon * R;
  const y = dLat * R;
  const horizontalDist = Math.sqrt(x * x + y * y);

  // Heading (azimuth from North, 0 to 360)
  let heading = Math.atan2(x, y); // atan2(dx, dy)
  heading = (toDeg(heading) + 360) % 360;

  // Trim (pitch)
  let trim = Math.atan2(dAlt, horizontalDist);
  trim = toDeg(trim);

  // Rotation (roll) — we can't know from 2 points, assume 0
  let rotation = 0;

  return [heading, trim, rotation];
}

window.applyFollowCam = function (e, o, t) {
  if (betterEnabled) {
    geofs.camera.lla = closestPointOnLineLLA(
      geofs.aircraft.instance.llaLocation,
      geofs.camera.lla
    );
    geofs.camera.htr = getHTR(
      geofs.aircraft.instance.llaLocation,
      geofs.camera.lla
    );
  } else {
    // Extract current orientations
    const u = o.orientations.current[0];
    const p = o.orientations.current[1];

    // Smoothing factor
    const h = 1 - Math.exp(-e / 0.5);

    // Interpolate HTR
    const deltaH = fixAngle(t.htr[0] - o.lastUsedHtr[0]);
    const deltaT = fixAngle(t.htr[1] - o.lastUsedHtr[1]);

    const m = o.lastUsedHtr[0] + deltaH * h;
    const f = o.lastUsedHtr[1] + deltaT * h;

    o.lastUsedHtr = [m, f, 0];

    // Apply orientation offsets
    const g = m + u;
    const y = f + p;

    // Build rotation matrix
    const rotation = M33.rotationXYZ(M33.identity(), [
      y * DEGREES_TO_RAD,
      0,
      g * DEGREES_TO_RAD,
    ]);

    // Set base camera position
    const basePosition = V3.add(o.position, o.offsets.current);
    geofs.camera.worldPosition = basePosition;

    // Transform world position
    let transformed = M33.transform(rotation, geofs.camera.worldPosition);
    let distanceOffset = V3.scale(rotation[1], -o.distance);

    // Follow-motion adjustments
    if (geofs.preferences.camera.followMotion) {
      const smoothAccel = V3.exponentialSmoothing(
        "elasticcam",
        t.rigidBody.v_acceleration,
        1,
        t.rigidBody.v_acceleration,
        e
      );

      const motionAdjust1 = V3.scale(
        smoothAccel,
        0.1 * t.definition.motionSensitivity
      );
      const motionAdjust2 = V3.scale(
        smoothAccel,
        0.2 * t.definition.motionSensitivity
      );

      transformed = V3.sub(transformed, motionAdjust1);
      distanceOffset = V3.sub(distanceOffset, motionAdjust2);
    }

    // Convert to LLA
    const S = V3.add(t.llaLocation, xyz2lla(transformed, t.llaLocation));
    const P = xyz2lla(distanceOffset, S);
    geofs.camera.lla = V3.add(S, P);
    geofs.camera.htr = lookAt(S, geofs.camera.lla, [0, 0, 1]);
    geofs.camera.htr = [
      fixAngle360(geofs.camera.htr[0]),
      fixAngle360(-geofs.camera.htr[1]),
      0,
    ];
  }

  // Avoid ground collision
  geofs.camera.avoidGround();

  // Apply camera transform
  geofs.api.setCameraPositionAndOrientation(
    geofs.camera.cam,
    geofs.camera.lla,
    geofs.camera.htr
  );
};

geofs.camera.update = function (e) {
  var t = geofs.aircraft.instance;
  if (!geofs.aircraft.instance.object3d) return;
  var a = geofs.aircraft.instance.object3d.getWorldFrame(),
    o = geofs.camera.currentDefinition;
  if (
    (geofs.camera.animations.orbitHorizontal.active &&
      (geofs.camera.rotate(geofs.camera.animations.orbitHorizontal.rate * e),
      geofs.camera.saveRotation()),
    geofs.camera.animations.orbitVertical.active)
  ) {
    var n = geofs.camera.animations.orbitVertical;
    fixAngle(geofs.camera.htr[1]),
      geofs.camera.rotate(null, n.rate * e),
      geofs.camera.saveRotation();
  }
  if (o.animations)
    for (var r in o.animations) {
      var s = o.animations[r],
        c = geofs.animation.filter(s);
      switch (s.type) {
        case "tilt":
          if (s.lastValue == c) continue;
          geofs.camera.setRotation(null, c);
          break;
        case "offset":
          if (s.lastValue == c) continue;
          var d = V3.scale(s.axis, c);
          geofs.camera.setOffsets(d[0], d[1], d[2]);
          break;
        case "translate":
          if (s.lastValue == c) continue;
          var d = V3.scale(s.axis, c);
          geofs.camera.translate(d[0], d[1], d[2]);
          break;
        case "distance":
          if (s.lastValue == c) continue;
          o.distance = c;
      }
      s.lastValue = c;
    }
  if ("follow" == geofs.camera.currentModeName && !betterEnabled) {
    window.applyFollowCam(e, o, t);
  } else if ("chase" == geofs.camera.currentModeName)
    geofs.camera.avoidGround(),
      (geofs.camera.lla = geofs.api.getCameraLla(geofs.camera.cam)),
      controls.mouse.down ||
        ((geofs.camera.htr = lookAt(
          t.llaLocation,
          geofs.camera.lla,
          [0, 0, 1]
        )),
        (geofs.camera.htr = [
          fixAngle360(geofs.camera.htr[0]),
          fixAngle360(-geofs.camera.htr[1]),
          0,
        ]),
        geofs.api.setCameraPositionAndOrientation(
          geofs.camera.cam,
          geofs.camera.lla,
          geofs.camera.htr
        ));
  else if ("free" == geofs.camera.currentModeName)
    geofs.camera.avoidGround(),
      (geofs.camera.lla = geofs.api.getCameraLla(geofs.camera.cam)),
      (geofs.camera.htr[0] = geofs.api.getHeading(geofs.camera.cam)),
      (geofs.camera.htr[1] = geofs.api.getTilt(geofs.camera.cam));
  else {
    var g = o.orientations.current[0],
      y = o.orientations.current[1],
      A = o.orientations.current[2],
      k = a;
    o.parent &&
      (k = geofs.aircraft.instance.parts[o.parent].object3d.getWorldFrame());
    var v = M33.rotationXYZ(k, [
      -y * DEGREES_TO_RAD,
      A * DEGREES_TO_RAD,
      g * DEGREES_TO_RAD,
    ]);
    if (
      ((geofs.camera.htr = M33.getOrientation(v)),
      (geofs.camera.worldPosition = V3.add(o.position, o.offsets.current)),
      "cockpit" == geofs.camera.currentModeName &&
        geofs.preferences.camera.headMotion)
    ) {
      var T = V3.scale(
        [
          -geofs.animation.values.accX,
          -geofs.animation.values.accY,
          -geofs.animation.values.accZ,
        ],
        0.001 * t.definition.motionSensitivity
      );
      (T = V3.exponentialSmoothing("lasmooth", T, 4, T, e)),
        (geofs.camera.motionOffset[0] =
          T[0] /
          (geofs.camera.motionRange /
            (geofs.camera.motionRange - geofs.camera.motionOffset[0]))),
        (geofs.camera.motionOffset[1] =
          T[1] /
          (geofs.camera.motionRange /
            (geofs.camera.motionRange - geofs.camera.motionOffset[1]))),
        (geofs.camera.motionOffset[2] =
          T[2] /
          (geofs.camera.motionRange /
            (geofs.camera.motionRange - geofs.camera.motionOffset[2]))),
        (geofs.camera.motionOffset = V3.clamp(
          geofs.camera.motionOffset,
          -geofs.camera.motionRange,
          geofs.camera.motionRange
        )),
        (geofs.camera.worldPosition = V3.add(
          geofs.camera.worldPosition,
          geofs.camera.motionOffset
        ));
      var C = V3.scale(
        [
          -geofs.animation.values.aAccX,
          -geofs.animation.values.aAccY,
          -geofs.animation.values.aAccZ,
        ],
        2 * t.definition.motionSensitivity
      );
      (C = V3.exponentialSmoothing("rasmooth", C, 4, C, e)),
        (geofs.camera.rotationOffset[0] =
          C[0] /
          (geofs.camera.rotationRange /
            (geofs.camera.rotationRange - geofs.camera.rotationOffset[0]))),
        (geofs.camera.rotationOffset[1] =
          C[1] /
          (geofs.camera.rotationRange /
            (geofs.camera.rotationRange - geofs.camera.rotationOffset[1]))),
        (geofs.camera.rotationOffset[2] =
          C[2] /
          (geofs.camera.rotationRange /
            (geofs.camera.rotationRange - geofs.camera.rotationOffset[2]))),
        (geofs.camera.rotationOffset = V3.clamp(
          geofs.camera.rotationOffset,
          -geofs.camera.rotationRange,
          geofs.camera.rotationRange
        )),
        (geofs.camera.htr = V3.add(geofs.camera.htr, [
          geofs.camera.rotationOffset[2],
          geofs.camera.rotationOffset[0],
          geofs.camera.rotationOffset[1],
        ])),
        (geofs.camera.hasMoved = !0);
    }
    (geofs.camera.worldPosition = t.object3d.setVectorWorldPosition(
      geofs.camera.worldPosition
    )),
      "cockpit" == geofs.camera.currentModeName &&
        (geofs.camera.worldPosition = V3.scale(
          geofs.camera.worldPosition,
          geofs.aircraft.instance.definition.cockpitScaleFix
        )),
      o.parent &&
        (geofs.camera.worldPosition = V3.add(
          geofs.camera.worldPosition,
          geofs.aircraft.instance.parts[o.parent].object3d.getWorldPosition()
        )),
      (geofs.camera.lla = V3.add(
        t.llaLocation,
        xyz2lla(geofs.camera.worldPosition, t.llaLocation)
      )),
      geofs.camera.avoidGround(),
      (geofs.camera.htr = [
        fixAngle360(geofs.camera.htr[0]),
        fixAngle360(-geofs.camera.htr[1]),
        -geofs.camera.htr[2],
      ]),
      geofs.api.setCameraPositionAndOrientation(
        geofs.camera.cam,
        geofs.camera.lla,
        geofs.camera.htr
      );
  }
  geofs.camera.radianRoll = geofs.camera.htr[2] * DEGREES_TO_RAD;
  let R = V3.normalize(
    lla2xyz(V3.sub(geofs.camera.lla, t.llaLocation), geofs.camera.lla)
  );
  (geofs.camera.dotAircraftForward = V3.dot(R, a[1])),
    geofs.camera.openSlave && geofs.camera.updateSlaveData(),
    "cockpit" == geofs.camera.currentModeName &&
      geofs.camera.hasMoved &&
      (instruments.updateCockpitPositions(), (geofs.camera.hasMoved = !1));
};
