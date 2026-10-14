//Generic HUD Panel 
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.createHudPanel = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DEFAULT_PANEL_STYLE = `
    position: fixed;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 6px 12px;
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    z-index: 9999;
    display: flex;
    gap: 12px;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    user-select: none;
    opacity: 1;
    transition: opacity 0.3s;
    white-space: nowrap;
  `;

  function createField(label) {
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

    return {
      container,
      // Helper methods for the consumer
      setValue: (text) => {
        valueSpan.textContent = text;
      },
      setColor: (color) => {
        valueSpan.style.color = color;
      },
      resetColor: () => {
        valueSpan.style.color = "";
      },
      element: valueSpan,
    };
  }

  function createSeparator() {
    const sep = document.createElement("span");
    sep.textContent = "|";
    sep.style.color = "rgba(255, 255, 255, 0.3)";
    sep.style.margin = "0 2px";
    return sep;
  }

  return function createHudPanel({ fields = {}, onUpdate, interval = 200, cssText = "" }) {
    let panel = null;
    let timerId = null;
    let fieldHandles = {};

    return {
      create() {
        if (panel) return;

        panel = document.createElement("div");
        panel.style.cssText = DEFAULT_PANEL_STYLE + cssText;

        panel.addEventListener("click", () => {
          panel.style.opacity = panel.style.opacity === "1" ? "0" : "1";
        });

        const entries = Object.entries(fields);
        entries.forEach(([key, label], index) => {
          const field = createField(label);
          fieldHandles[key] = field;
          panel.appendChild(field.container);

          if (index < entries.length - 1) {
            panel.appendChild(createSeparator());
          }
        });

        document.body.appendChild(panel);

        if (typeof onUpdate === "function") {
          const tick = () => onUpdate(fieldHandles);
          timerId = setInterval(tick, interval);
          tick(); // Initial sync
        }
      },

      destroy() {
        if (timerId) {
          clearInterval(timerId);
          timerId = null;
        }
        if (panel) {
          panel.remove();
          panel = null;
        }
        fieldHandles = {};
      },

      getElement: () => panel,
      getFields: () => fieldHandles,
    };
  };
});