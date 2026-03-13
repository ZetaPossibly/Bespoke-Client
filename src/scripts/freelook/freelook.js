// //  !>---[ This script is under the CC BY-NC-ND Licence. Creative Commons Attribution-NonCommercial-NoDerivs. ]---<!
// (function () {
//   /// NOTE: Ensure that this key does not conflict with any other keybinds.
//   //        It will not overwrite them, and both the freelook and the other action
//   //        will occur simultaneously.

//   const prefix = "freelook";
//   const freeLookUi = new window.BUIM("Freelook", prefix);
//   freeLookUi.addItem("X Sensitivity: ", "xSens", "number", 0, "0.2");
//   freeLookUi.addItem("Y Sensitivity: ", "ySens", "number", 0, "0.2");
//   freeLookUi.addItem("Reset Speed: ", "ResetSpeed", "number", 0, "0.25");

//   freeLookUi.addKBShortcut(
//     "Use Freelook: ",
//     "hotkey",
//     1,
//     "z",
//     function () {
//       if (
//         document.activeElement.tagName.toLowerCase() !== "input" &&
//         document.activeElement.tagName.toLowerCase() !== "textarea"
//       ) {
//         if (
//           geofs.camera.zKeyPressed === false &&
//           !geofs.camera.reset_animating
//         ) {
//           geofs.camera.freeLookBase = [
//             geofs.camera.currentDefinition.orientations.current[0],
//             geofs.camera.currentDefinition.orientations.current[1],
//           ];
//           console.log("Logged!");
//           console.log(geofs.camera.freeLookBase);
//         }

//         geofs.camera.reset_animating = false;
//         geofs.camera.zKeyPressed = true;

//         geofs.camera.freeLookEnabled = true;
//         controls.mouseOnHold = true;
//         if (!isCursorHidden) {
//           toggleCursor();
//         }
//       }
//     },
//     function () {
//       if (e.key.toLowerCase() === freeLookUi.getItem("hotkey")) {
//         geofs.camera.reset_animating = true;
//         geofs.camera.zKeyPressed = false;
//         geofs.camera.freeLookEnabled = false;
//         controls.mouseOnHold = false;
//         if (isCursorHidden) {
//           toggleCursor();
//         }
//       }
//     }
//   );

//   // Free look feature defaults for follow camera mode
//   geofs.camera.freeLookEnabled = false;
//   geofs.camera.freeLookOffset = [0, 0]; // [heading offset, tilt offset] for free look adjustments
//   geofs.camera.freeLookBase = [
//     geofs.camera.currentDefinition.orientations.current[0],
//     geofs.camera.currentDefinition.orientations.current[1],
//   ];

//   // Track if the Z key is being pressed
//   geofs.camera.zKeyPressed = false;
//   geofs.camera.reset_animating = false;

//   // Threshold for considering the camera reset "close enough"
//   geofs.camera.RESET_THRESHOLD = 0.05;

//   let isCursorHidden = false;

//   // Create a style element
//   const style = document.createElement("style");
//   style.textContent = `.hide-cursor { cursor: none !important; }`;
//   document.head.appendChild(style);

//   function toggleCursor() {
//     isCursorHidden = !isCursorHidden;
//     document.body.classList.toggle("hide-cursor", isCursorHidden);
//   }


//   geofs.api.viewer.scene.preRender.addEventListener(() => {
//     window.freelook_reset_speed =
//       localStorage.getItem(prefix + "ResetSpeed") || 0.25;
//     if (geofs.camera.reset_animating === true) {
//       const currentHeading =
//         geofs.camera.currentDefinition.orientations.current[0];
//       const currentTilt =
//         geofs.camera.currentDefinition.orientations.current[1];
//       const targetHeading = geofs.camera.freeLookBase[0];
//       const targetTilt = geofs.camera.freeLookBase[1];

//       // Calculate new positions with lerp
//       const newHeading = geofs.perlin.lerp(
//         currentHeading,
//         targetHeading,
//         window.freelook_reset_speed,
//       );
//       const newTilt = geofs.perlin.lerp(
//         currentTilt,
//         targetTilt,
//         window.freelook_reset_speed,
//       );

//       // Apply the new camera position
//       geofs.camera.lookAround(newHeading, newTilt);

//       // Check if we're close enough to the target to stop animating
//       const isCloseEnough =
//         Math.abs(newHeading - targetHeading) < geofs.camera.RESET_THRESHOLD &&
//         Math.abs(newTilt - targetTilt) < geofs.camera.RESET_THRESHOLD;

//       if (isCloseEnough) {
//         geofs.camera.reset_animating = false;
//         // Ensure we set exactly to the target
//         geofs.camera.lookAround(targetHeading, targetTilt);
//       }
//     }
//   });

//   // Add an event listener for mousemove to update free look offsets when enabled
//   window.addEventListener("mousemove", (e) => {
//     const xSens = parseFloat(freeLookUi.getItem("xSens"));
//     const ySens = parseFloat(freeLookUi.getItem("ySens"));
//     if (geofs.camera.freeLookEnabled) {
//       geofs.camera.freeLookOffset[0] += e.movementX * xSens;
//       geofs.camera.freeLookOffset[1] +=
//         e.movementY *
//         ySens *
//         (geofs.camera.currentModeName === "cockpit" ? -1 : 1);
//       geofs.camera.lookAround(
//         geofs.camera.freeLookBase[0] + geofs.camera.freeLookOffset[0],
//         geofs.camera.freeLookBase[1] + geofs.camera.freeLookOffset[1],
//       );
//     } else {
//       geofs.camera.freeLookOffset = [0, 0];
//     }
//   });

//   window.addEventListener("mousedown", (e) => {
//     geofs.camera.reset_animating = false;
//   });
// })();

(function () {
  // ─── UI ───────────────────────────────────────────────────────────────────
  const prefix = "freelook";
  const freeLookUi = new window.BUIM("Freelook", prefix);
  freeLookUi.addItem("X Sensitivity: ",        "xSens",       "number",   0, "0.2");
  freeLookUi.addItem("Y Sensitivity: ",        "ySens",       "number",   0, "0.2");
  freeLookUi.addItem("Reset Speed: ",          "ResetSpeed",  "number",   0, "0.25");
  freeLookUi.addItem("Smooth Speed: ",         "SmoothSpeed", "number",   0, "0.18");
  freeLookUi.addItem("Accel Strength: ",       "AccelStr",    "number",   0, "0.04");
  freeLookUi.addItem("Mouse Acceleration: ",   "MouseAccel",  "checkbox", 0, false);

  // ─── State ────────────────────────────────────────────────────────────────
  let isActive         = false;
  let isResetAnimating = false;
  let isCursorHidden   = false;

  // Smooth follow: target is where the mouse says to go,
  // current is where the camera actually is (lerped toward target each frame).
  let targetHeadingOffset  = 0;
  let targetTiltOffset     = 0;
  let currentHeadingOffset = 0;
  let currentTiltOffset    = 0;

  // The base orientation captured at the moment freelook is activated.
  let freeLookBase = [0, 0];

  // ─── Cursor helper ────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `.freelook-hide-cursor { cursor: none !important; }`;
  document.head.appendChild(style);

  function setCursorHidden(hidden) {
    if (hidden === isCursorHidden) return;
    isCursorHidden = hidden;
    document.body.classList.toggle("freelook-hide-cursor", hidden);
  }

  // ─── Activate / Deactivate ────────────────────────────────────────────────
  function activate() {
    // Bail out if already active or mid-reset (wait for reset to finish).
    if (isActive) return;

    const orientations = geofs.camera.currentDefinition?.orientations?.current;
    if (!orientations) return;

    // Capture base orientation and zero out all offsets.
    freeLookBase         = [orientations[0], orientations[1]];
    targetHeadingOffset  = 0;
    targetTiltOffset     = 0;
    currentHeadingOffset = 0;
    currentTiltOffset    = 0;
    isResetAnimating     = false;

    isActive             = true;
    controls.mouseOnHold = true;
    setCursorHidden(true);
  }

  function deactivate() {
    if (!isActive) return;

    isActive             = false;
    isResetAnimating     = true;
    controls.mouseOnHold = false;
    setCursorHidden(false);
  }

  // ─── Keybind ──────────────────────────────────────────────────────────────
  freeLookUi.addKBShortcut(
    "Use Freelook: ",
    "hotkey",
    1,
    "z",
    // keydown
    function () {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      activate();
    },
    // keyup  — note the (e) parameter: this was the root cause of the release bug
    function () {
        deactivate();
    }
  );

  // ─── Per-frame render loop ────────────────────────────────────────────────
  geofs.api.viewer.scene.preRender.addEventListener(() => {
    // Read settings once per frame (cheap; avoids stale closures).
    const resetSpeed  = parseFloat(freeLookUi.getItem("ResetSpeed"))  || 0.25;
    const smoothSpeed = parseFloat(freeLookUi.getItem("SmoothSpeed")) || 0.18;

    if (isActive) {
      // Lerp current offsets toward the mouse-driven target for smooth motion.
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

      const newH = curH + (tgtH - curH) * resetSpeed;
      const newT = curT + (tgtT - curT) * resetSpeed;

      geofs.camera.lookAround(newH, newT);

      // Snap to exact target once close enough to avoid infinite creep.
      if (Math.abs(newH - tgtH) < 0.05 && Math.abs(newT - tgtT) < 0.05) {
        geofs.camera.lookAround(tgtH, tgtT);
        isResetAnimating = false;
      }
    }
  });

  // ─── Mouse move ───────────────────────────────────────────────────────────
  window.addEventListener("mousemove", (e) => {
    if (!isActive) return;

    const xSens     = parseFloat(freeLookUi.getItem("xSens"))     || 0.2;
    const ySens     = parseFloat(freeLookUi.getItem("ySens"))      || 0.2;
    const accelOn   = freeLookUi.getItem("MouseAccel") === "true";
    const accelStr  = parseFloat(freeLookUi.getItem("AccelStr"))   || 0.04;

    let dx = e.movementX;
    let dy = e.movementY;

    if (accelOn) {
      // Acceleration: faster physical movement → higher effective sensitivity.
      // The multiplier grows with the speed of the raw input.
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
  // Scoped to the canvas so clicking UI elements doesn't interrupt the reset.
  const canvas = document.querySelector("canvas");
  if (canvas) {
    canvas.addEventListener("mousedown", () => {
      isResetAnimating = false;
    });
  }

})();