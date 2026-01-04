//  !>---[ This script is under the CC BY-NC-ND Licence. Creative Commons Attribution-NonCommercial-NoDerivs. ]---<!
(function () {
  /// NOTE: Ensure that this key does not conflict with any other keybinds.
  //        It will not overwrite them, and both the freelook and the other action
  //        will occur simultaneously.

  const prefix = "freelook";
  const freeLookUi = new window.BUIM("Freelook", prefix);
  freeLookUi.addItem("X Sensitivity: ", "xSens", "number", 0, "0.2");
  freeLookUi.addItem("Y Sensitivity: ", "ySens", "number", 0, "0.2");
  freeLookUi.addItem("Reset Speed: ", "ResetSpeed", "number", 0, "0.25");

  freeLookUi.addKBShortcut(
    "Use Freelook: ",
    "hotkey",
    1,
    "z",
    function () {
      if (
        document.activeElement.tagName.toLowerCase() !== "input" &&
        document.activeElement.tagName.toLowerCase() !== "textarea"
      ) {
        if (
          geofs.camera.zKeyPressed === false &&
          !geofs.camera.reset_animating
        ) {
          geofs.camera.freeLookBase = [
            geofs.camera.currentDefinition.orientations.current[0],
            geofs.camera.currentDefinition.orientations.current[1],
          ];
          console.log("Logged!");
          console.log(geofs.camera.freeLookBase);
        }

        geofs.camera.reset_animating = false;
        geofs.camera.zKeyPressed = true;

        geofs.camera.freeLookEnabled = true;
        controls.mouseOnHold = true;
        if (!isCursorHidden) {
          toggleCursor();
        }
      }
    },
    function () {
      if (e.key.toLowerCase() === freeLookUi.getItem("hotkey")) {
        geofs.camera.reset_animating = true;
        geofs.camera.zKeyPressed = false;
        geofs.camera.freeLookEnabled = false;
        controls.mouseOnHold = false;
        if (isCursorHidden) {
          toggleCursor();
        }
      }
    }
  );

  // Free look feature defaults for follow camera mode
  geofs.camera.freeLookEnabled = false;
  geofs.camera.freeLookOffset = [0, 0]; // [heading offset, tilt offset] for free look adjustments
  geofs.camera.freeLookBase = [
    geofs.camera.currentDefinition.orientations.current[0],
    geofs.camera.currentDefinition.orientations.current[1],
  ];

  // Track if the Z key is being pressed
  geofs.camera.zKeyPressed = false;
  geofs.camera.reset_animating = false;

  // Threshold for considering the camera reset "close enough"
  geofs.camera.RESET_THRESHOLD = 0.05;

  let isCursorHidden = false;

  // Create a style element
  const style = document.createElement("style");
  style.textContent = `.hide-cursor { cursor: none !important; }`;
  document.head.appendChild(style);

  function toggleCursor() {
    isCursorHidden = !isCursorHidden;
    document.body.classList.toggle("hide-cursor", isCursorHidden);
  }


  geofs.api.viewer.scene.preRender.addEventListener(() => {
    window.freelook_reset_speed = localStorage.getItem(prefix+"ResetSpeed") || 0.25;
    if (geofs.camera.reset_animating === true) {
      const currentHeading =
        geofs.camera.currentDefinition.orientations.current[0];
      const currentTilt =
        geofs.camera.currentDefinition.orientations.current[1];
      const targetHeading = geofs.camera.freeLookBase[0];
      const targetTilt = geofs.camera.freeLookBase[1];

      // Calculate new positions with lerp
      const newHeading = geofs.perlin.lerp(
        currentHeading,
        targetHeading,
        window.freelook_reset_speed
      );
      const newTilt = geofs.perlin.lerp(
        currentTilt,
        targetTilt,
        window.freelook_reset_speed
      );

      // Apply the new camera position
      geofs.camera.lookAround(newHeading, newTilt);

      // Check if we're close enough to the target to stop animating
      const isCloseEnough =
        Math.abs(newHeading - targetHeading) < geofs.camera.RESET_THRESHOLD &&
        Math.abs(newTilt - targetTilt) < geofs.camera.RESET_THRESHOLD;

      if (isCloseEnough) {
        geofs.camera.reset_animating = false;
        // Ensure we set exactly to the target
        geofs.camera.lookAround(targetHeading, targetTilt);
      }
    }
  });

  // Add an event listener for mousemove to update free look offsets when enabled
  window.addEventListener("mousemove", (e) => {
    const xSens = parseFloat(freeLookUi.getItem("xSens"));
    const ySens = parseFloat(freeLookUi.getItem("ySens"));
    if (geofs.camera.freeLookEnabled) {
      geofs.camera.freeLookOffset[0] += e.movementX * xSens;
      geofs.camera.freeLookOffset[1] +=
        e.movementY *
        ySens *
        (geofs.camera.currentModeName === "cockpit" ? -1 : 1);
      geofs.camera.lookAround(
        geofs.camera.freeLookBase[0] + geofs.camera.freeLookOffset[0],
        geofs.camera.freeLookBase[1] + geofs.camera.freeLookOffset[1]
      );
    } else {
      geofs.camera.freeLookOffset = [0, 0];
    }
  });

  window.addEventListener("mousedown", (e) => {
    geofs.camera.reset_animating = false;
  });
})();
