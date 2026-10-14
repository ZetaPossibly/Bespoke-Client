(function () {
  "use strict";

  let rafId = null;
  let frameCount = 0;
  let lastTime = performance.now();

  const panelInstance = window.createHudPanel({
    fields: {
      fps: "FPS",
    },

    cssText: "top: 85px; right: 10px; font-size: 14px; padding: 5px 10px;",
  });

  function updateFPS() {
    const now = performance.now();
    frameCount++;
    const delta = now - lastTime;

    if (delta >= 1000) {
      const fps = (frameCount / delta) * 1000;
      const fields = panelInstance.getFields();

      if (fields.fps) {
        fields.fps.setValue(fps.toFixed(2));
      }

      lastTime = now;
      frameCount = 0;
    }

    rafId = requestAnimationFrame(updateFPS);
  }

  window.createFPSDisplay = function () {
    if (panelInstance.getElement()) return;

    panelInstance.create();

    // Reset counters and start rAF loop
    frameCount = 0;
    lastTime = performance.now();
    rafId = requestAnimationFrame(updateFPS);
  };

  window.destroyFPSDisplay = function () {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    panelInstance.destroy();
  };
})();