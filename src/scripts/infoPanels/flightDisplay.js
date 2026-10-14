(function () {
  "use strict";

  const panelInstance = window.createHudPanel({
    fields: {
      alt: "ALT",
      spd: "SPD",
      vs: "VS",
      hdg: "HDG",
    },
    interval: 200,
    onUpdate: (fields) => {
      if (!window.geofs?.animation?.values) return;
      const vals = geofs.animation.values;

      fields.alt.setValue(`${Math.round(vals.altitude)}ft`);
      fields.spd.setValue(`${Math.round(vals.kias)}kt`);
      fields.hdg.setValue(`${Math.round(vals.heading)}°`);

      const vs = Math.round(vals.verticalSpeed);
      fields.vs.setValue(`${vs}fpm`);
      fields.vs.setColor(Math.abs(vs) > 2000 ? "#ff6b6b" : "white");
    },
    cssText: "top: 50px; right: 10px;"
  });

  window.flightDisplay = {
    create: () => panelInstance.create(),
    destroy: () => panelInstance.destroy(),
  };
})();