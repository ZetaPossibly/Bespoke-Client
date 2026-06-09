(function () {
  const prefix = "freelook";
  const freeLookUi = new window.BUIM("Freelook", prefix)
    .addItem("X Sensitivity: ", "xSens", "number", 0.2)
    .addItem("Y Sensitivity: ", "ySens", "number", 0.2)
    .addItem("Smooth Speed: ", "SmoothSpeed", "number", 10);

  let tiltSilk = new Silk(0, { speed: freeLookUi.get("SmoothSpeed"), sensitivity: freeLookUi.get("ySens") });
  let headingSilk = new Silk(0, { speed: freeLookUi.get("SmoothSpeed"), sensitivity: freeLookUi.get("xSens") });

  let isActive = false;
  let isResetAnimating = false;

  let freeLookBase = [0, 0];

  // find shortest straight route to resting
  function shortestDelta(from, to) {
    let d = (to - from) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }

  // capture mouse
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

  function activate() {
    if (isActive) return;

    const orientations = geofs.camera.currentDefinition?.orientations?.current;
    if (!orientations) return;

    freeLookBase = [orientations[0], orientations[1]];
    isResetAnimating = false;

    headingSilk.setCurrent(0);
    headingSilk.setTarget(0);
    tiltSilk.setCurrent(0);
    tiltSilk.setTarget(0);

    isActive = true;
    controls.mouseOnHold = true;

    requestLock();
  }

  setInterval(() => {
    if (isActive) {
      headingSilk.speed = parseFloat(freeLookUi.get("SmoothSpeed")) || 0.4;
      headingSilk.sensitivity = parseFloat(freeLookUi.get("xSens"));
      tiltSilk.speed = parseFloat(freeLookUi.get("SmoothSpeed")) || 0.4;
      tiltSilk.sensitivity = parseFloat(freeLookUi.get("ySens"));
    }
  }, 1000);

  function deactivate() {
    if (!isActive) return;

    isActive = false;
    isResetAnimating = true;
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
    },
  );

  // ─── Per-frame render loop ────────────────────────────────────────────────
  geofs.api.viewer.scene.preRender.addEventListener(() => {
    const resetSpeed = parseFloat(freeLookUi.get("ResetSpeed")) || 0.25;
    const dt = window.gameDeltaTime || 0;

    if (isActive) {
      // Sync speed from UI each frame so live tweaks take effect
      headingSilk.speed = parseFloat(freeLookUi.get("SmoothSpeed")) || 0.4;
      tiltSilk.speed = parseFloat(freeLookUi.get("SmoothSpeed")) || 0.4;

      geofs.camera.lookAround(freeLookBase[0] + headingSilk.update(dt), freeLookBase[1] + tiltSilk.update(dt));
    } else if (isResetAnimating) {
      const orientations = geofs.camera.currentDefinition?.orientations?.current;
      if (!orientations) {
        isResetAnimating = false;
        return;
      }

      const curH = orientations[0];
      const curT = orientations[1];
      const tgtH = freeLookBase[0];
      const tgtT = freeLookBase[1];

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

  window.addEventListener("mousemove", (e) => {
    if (!isActive) return;

    let dx = e.movementX;
    let dy = e.movementY;

    const isCockpit = geofs.camera.currentModeName === "cockpit";

    headingSilk.setTarget(headingSilk.raw_target + dx);
    tiltSilk.setTarget(tiltSilk.raw_target + dy * (isCockpit ? -1 : 1));
  });

  const canvas = document.querySelector("canvas");
  if (canvas) {
    canvas.addEventListener("mousedown", () => {
      isResetAnimating = false;
    });
  }
})();
