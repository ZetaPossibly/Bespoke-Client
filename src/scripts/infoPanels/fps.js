(function () {
  "use strict";

  let panel = null;
  let intervalId = null;

  const createDataElement = (label) => {
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "4px";

    const labelSpan = document.createElement("span");
    labelSpan.textContent = label;
    labelSpan.style.color = "#aaa";
    labelSpan.style.fontSize = "12px";

    const valueSpan = document.createElement("span");
    valueSpan.className = "value";

    container.appendChild(labelSpan);
    container.appendChild(valueSpan);

    return { container, value: valueSpan };
  };

  window.flightDisplay = {
    create() {
      if (panel) return;

      panel = document.createElement("div");
      panel.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        background: rgba(0,0,0,0.75);
        color: white;
        padding: 6px 12px;
        border-radius: 8px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        z-index: 9999;
        display: flex;
        gap: 12px;
        align-items: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        cursor: pointer;
        user-select: none;
        opacity: 1;
        transition: opacity 0.3s;
        white-space: nowrap;
      `;
      document.body.appendChild(panel);
      panel.addEventListener("click", () => {
        panel.style.opacity = panel.style.opacity === "1" ? "0" : "1";
      });

      const fields = {
        alt: createDataElement("ALT"),
        spd: createDataElement("SPD"),
        vs: createDataElement("VS"),
        hdg: createDataElement("HDG"),
      };

      Object.values(fields).forEach((field, index) => {
        panel.appendChild(field.container);
        if (index < Object.keys(fields).length - 1) {
          const sep = document.createElement("span");
          sep.textContent = "|";
          sep.style.color = "rgba(255,255,255,0.3)";
          sep.style.margin = "0 2px";
          panel.appendChild(sep);
        }
      });

      function updateFlightData() {
        if (!window.geofs || !geofs.animation.values) return;
        const vals = geofs.animation.values;
        fields.alt.value.textContent = `${Math.round(vals.altitude)}ft`;
        fields.spd.value.textContent = `${Math.round(vals.kias)}kt`;
        fields.hdg.value.textContent = `${Math.round(vals.heading)}°`;
        const vs = Math.round(vals.verticalSpeed);
        fields.vs.value.textContent = `${vs}fpm`;
        fields.vs.value.style.color = vs > 2000 || vs < -2000 ? "#ff6b6b" : "white";
      }

      intervalId = setInterval(updateFlightData, 200);
      updateFlightData();
    },

    destroy() {
      if (panel) {
        panel.remove();
        panel = null;
      }
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
  };

})();