(function () {
  // ─── UI ───────────────────────────────────────────────────────────────────
  const prefix = "freelook";
  const freeLookUi = new window.BUIM("Freelook", prefix)
    .addItem("X Sensitivity: ",        "xSens",       "number",   0.2)
    .addItem("Y Sensitivity: ",        "ySens",       "number",   0.2)
    .addItem("Reset Speed: ",          "ResetSpeed",  "number",   0.4)
    .addItem("Smooth Speed: ",         "SmoothSpeed", "number",   0.4)
    .addItem("Accel Strength: ",       "AccelStr",    "number",   0.001)
    .addItem("Mouse Acceleration: ",   "MouseAccel",  "checkbox", false)

  // ─── State ────────────────────────────────────────────────────────────────
  let isActive         = false;
  let isResetAnimating = false;

  let targetHeadingOffset  = 0;
  let targetTiltOffset     = 0;
  let currentHeadingOffset = 0;
  let currentTiltOffset    = 0;

  let freeLookBase = [0, 0];

  // ─── Angle helper ─────────────────────────────────────────────────────────
  // Returns the shortest signed delta from `from` to `to` in the range [-180, 180].
  function shortestDelta(from, to) {
    let d = (to - from) % 360;
    if (d >  180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  // ─── Pointer Lock helpers ─────────────────────────────────────────────────
  function requestLock() {
    const canvas = document.querySelector("canvas");
    if (canvas && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  }

  function releaseLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  // ─── Activate / Deactivate ────────────────────────────────────────────────
  function activate() {
    if (isActive) return;

    const orientations = geofs.camera.currentDefinition?.orientations?.current;
    if (!orientations) return;

    freeLookBase         = [orientations[0], orientations[1]];
    targetHeadingOffset  = 0;
    targetTiltOffset     = 0;
    currentHeadingOffset = 0;
    currentTiltOffset    = 0;
    isResetAnimating     = false;

    isActive             = true;
    controls.mouseOnHold = true;

    requestLock();
  }

  function deactivate() {
    if (!isActive) return;

    isActive             = false;
    isResetAnimating     = true;
    controls.mouseOnHold = false;

    releaseLock();
  }

  // ─── Keybind ──────────────────────────────────────────────────────────────
  freeLookUi.addShortcut(
    "Use Freelook: ",
    "hotkey",
    "KeyZ&,false&,false&,false&,false",
    (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      activate();
    },
    (e) => {
      deactivate();
    }
  );

  // ─── Per-frame render loop ────────────────────────────────────────────────
  geofs.api.viewer.scene.preRender.addEventListener(() => {
    const resetSpeed  = parseFloat(freeLookUi.get("ResetSpeed"))  || 0.25;
    const smoothSpeed = parseFloat(freeLookUi.get("SmoothSpeed")) || 0.18;

    if (isActive) {
      currentHeadingOffset += (targetHeadingOffset - currentHeadingOffset) * smoothSpeed;
      currentTiltOffset    += (targetTiltOffset    - currentTiltOffset)    * smoothSpeed;

      geofs.camera.lookAround(
        freeLookBase[0] + currentHeadingOffset,
        freeLookBase[1] + currentTiltOffset
      );

    } else if (isResetAnimating) {
      const orientations = geofs.camera.currentDefinition?.orientations?.current;
      if (!orientations) { isResetAnimating = false; return; }

      const curH = orientations[0];
      const curT = orientations[1];
      const tgtH = freeLookBase[0];
      const tgtT = freeLookBase[1];

      // Use shortest angular path so a 370° position resets like a 10° position.
      const diffH = shortestDelta(curH, tgtH);
      const diffT = shortestDelta(curT, tgtT);

      const newH = curH + diffH * resetSpeed;
      const newT = curT + diffT * resetSpeed;

      geofs.camera.lookAround(newH, newT);

      if (Math.abs(diffH) < 0.05 && Math.abs(diffT) < 0.05) {
        geofs.camera.lookAround(tgtH, tgtT);
        isResetAnimating = false;
      }
    }
  });

  // ─── Mouse move ───────────────────────────────────────────────────────────
  // movementX/Y works correctly whether pointer lock is active or not,
  // but pointer lock ensures the cursor can't escape the window mid-spin.
  window.addEventListener("mousemove", (e) => {
    if (!isActive) return;

    const xSens    = parseFloat(freeLookUi.get("xSens"))    || 0.2;
    const ySens    = parseFloat(freeLookUi.get("ySens"))     || 0.2;
    const accelOn  = freeLookUi.get("MouseAccel") === "true";
    const accelStr = parseFloat(freeLookUi.get("AccelStr"))  || 0.04;

    let dx = e.movementX;
    let dy = e.movementY;

    if (accelOn) {
      const speed      = Math.sqrt(dx * dx + dy * dy);
      const multiplier = 1 + speed * accelStr;
      dx *= multiplier;
      dy *= multiplier;
    }

    const isCockpit = geofs.camera.currentModeName === "cockpit";

    targetHeadingOffset += dx * xSens;
    targetTiltOffset    += dy * ySens * (isCockpit ? -1 : 1);
  });

  // ─── Cancel reset on canvas click ────────────────────────────────────────
  const canvas = document.querySelector("canvas");
  if (canvas) {
    canvas.addEventListener("mousedown", () => {
      isResetAnimating = false;
    });
  }

})();