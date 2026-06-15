/**
 * BUIM — Bespoke User Interface Manager
 * An Eschaton Project. Made by Zeta.
 */

window.BUIM = (() => {
  // ─── Constants ────────────────────────────────────────────────────────────

  const MENU_STYLES = `
    .buim-menu {
      position: absolute;
      left: 0.625rem;
      top: 3.125rem;
      width: 250px;
      min-width: 150px;
      max-height: 70vh;
      overflow-y: auto;
      background: rgba(0, 0, 0, 0.75);
      z-index: 9999;
      font-size: 13px;
      padding: 6px 12px 12px;
      backdrop-filter: blur(5px);
      color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
      scrollbar-color: slategrey transparent;
      scrollbar-width: thin;
      text-align: center;
      display: none;
    }
    .buim-menu-title { margin: 8px 0 4px; }
    .buim-menu-subtitle { margin: 0 0 8px; font-style: italic; opacity: 0.6; }

    .buim-section {
      margin: 5px 0;
      border-radius: 4px;
      background: linear-gradient(to bottom, black 0%, rgba(0,0,0,0));
      backdrop-filter: blur(10px);
    }
    .buim-section-header {
      padding: 10px;
      cursor: pointer;
      user-select: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .buim-section-header:hover { background: rgba(255,255,255,0.1); border-radius: 4px; }
    .buim-section-title { margin: 0; flex: 1; text-align: left; color: white; font-size: 0.9rem; }

    .buim-section-body {
      display: none;
      padding: 10px;
      border-top: 1px solid #444;
      text-align: left;
    }
    .buim-section-body.open { display: block; }

    .buim-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin: 4px 0;
    }
    .buim-label { flex: 1; opacity: 0.85; }

    buim-header {
        flex:1; 
        opacity: 0.9;
        font-weight: bold;
        font-style: italic;
    }

    .buim-input {
      background: rgba(255,255,255,0.04);
      color: #eaeaea;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 120ms ease;
      box-sizing: border-box;
      width: 120px;
    }
    .buim-input:hover, .buim-input:focus { border-color: rgba(255,255,255,0.35); }

    .buim-checkbox { width: 16px; height: 16px; cursor: pointer; }
    .buim-enable-checkbox { width: 20px; height: 20px; cursor: pointer; flex-shrink: 0; }

    .buim-select {
      background: rgba(255,255,255,0.06);
      color: #eaeaea;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 4px 6px;
      font-size: 0.85rem;
    }

    .buim-btn {
      background: rgba(255,255,255,0.1);
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 5px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: background 120ms;
    }
    .buim-btn:hover { background: rgba(255,255,255,0.2); }
    .buim-btn-reset { margin-top: 8px; width: 100%; }

    .buim-shortcut-btn {
      background: rgba(80,120,255,0.15);
      color: #aac4ff;
      border: 1px solid rgba(80,120,255,0.35);
      border-radius: 5px;
      padding: 3px 8px;
      cursor: pointer;
      font-size: 0.8rem;
      font-family: monospace;
      transition: background 120ms;
      min-width: 80px;
    }
    .buim-shortcut-btn:hover { background: rgba(80,120,255,0.3); }
    .buim-shortcut-btn.listening { background: rgba(255,80,80,0.2); color: #ffaaaa; border-color: rgba(255,80,80,0.4); }

    #buim-open-btn {
      cursor: pointer;
      padding: 0 10px;
      display: inline-flex;
      align-items: center;
      height: 100%;
    }
  `;

  // ─── Store — thin localStorage wrapper ────────────────────────────────────

  /**
   * Centralised key-value store backed by localStorage.
   * All keys are namespaced by the section prefix to prevent collisions.
   */
  const Store = {
    get(key) {
      const raw = localStorage.getItem(key);
      return raw === null ? null : raw;
    },
    set(key, value) {
      console.log("Setting key: " + key + "... to ... " + value.toString());
      localStorage.setItem(key, String(value));
    },
    getOrDefault(key, defaultValue) {
      const v = this.get(key);
      if (v === null) {
        this.set(key, defaultValue);
        return String(defaultValue);
      }
      return v;
    },
    getBool(key, defaultValue = false) {
      return this.getOrDefault(key, defaultValue) === "true";
    },
  };

  // ─── MicroEmitter — replaces raw window.dispatchEvent string abuse ──────── mdl-button mdl-js-button geofs-f-standard-ui geofs-mediumScreenOnly

  class MicroEmitter {
    #listeners = new Map();

    on(event, fn) {
      if (!this.#listeners.has(event)) this.#listeners.set(event, []);
      this.#listeners.get(event).push(fn);
      return () => this.off(event, fn); // returns an unsubscribe fn
    }

    off(event, fn) {
      const list = this.#listeners.get(event) ?? [];
      this.#listeners.set(
        event,
        list.filter((f) => f !== fn),
      );
    }

    emit(event, data) {
      (this.#listeners.get(event) ?? []).forEach((fn) => fn(data));
    }
  }

  // ─── Module-level private state ───────────────────────────────────────────

  let _menuEl = null; // The floating menu <div>
  let _isOpen = false;
  let _isBootstrapped = false;

  const _emitter = new MicroEmitter();

  // ─── DOM helpers ──────────────────────────────────────────────────────────

  function toCamel(str) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "className") {
        node.className = v;
      } else if (k.startsWith("data-")) {
        node.dataset[toCamel(k.slice(5))] = v;
      } else {
        node[k] = v;
      }
    }
    for (const child of children) {
      if (child == null) continue;
      node.append(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return node;
  }

  function injectStyles() {
    if (document.getElementById("buim-styles")) return;
    const style = el("style", { id: "buim-styles", textContent: MENU_STYLES });
    document.head.appendChild(style);
  }

  /**
   * Waits for a CSS selector to appear in the DOM.
   * Uses MutationObserver correctly — always disconnects.
   */
  function waitForEl(selector) {
    return new Promise((resolve) => {
      const existing = document.querySelector(selector);
      if (existing) return resolve(existing);
      const obs = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
          obs.disconnect();
          resolve(found);
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });
  }

  // ─── Menu bootstrap ───────────────────────────────────────────────────────

  function bootstrapMenu() {
    if (_isBootstrapped) return;
    _isBootstrapped = true;

    injectStyles();

    _menuEl = el("div", {
      id: "buim-menu",
      className: "buim-menu",
    });

    // Header
    const header = el(
      "div",
      { className: "buim-menu-header" },
      el("h3", { className: "buim-menu-title" }, "Bespoke Client"),
      el(
        "p",
        { className: "buim-menu-subtitle" },
        "An Eschaton Project · Made by Zeta · ",
        el("i", {}, "@zetainbeta_43414 on Discord"),
      ),
    );
    _menuEl.appendChild(header);
    document.body.appendChild(_menuEl);

    // Trigger button — waits for the geofs bottom bar
    waitForEl(".geofs-ui-bottom").then((bottomBar) => {
      const btn = el("div", {
        id: "buim-open-btn",
        className: "mdl-button mdl-js-button geofs-f-standard-ui",
        textContent: "BESPOKE",
      });
      btn.addEventListener("click", toggleMenu);
      bottomBar.appendChild(btn);

      const container = document.querySelector(".geofs-ui-bottom");

      if (container) {
        container.addEventListener("click", (e) => {
          const closest_div = e.target.closest("div");
          if (closest_div.id == "buim-open-btn") {
            ui.collapseLeft();
          }
        });
      }
    });
  }

  function toggleMenu(o) {
    _isOpen = typeof o === "boolean" ? o : !_isOpen;

    _menuEl.style.display = _isOpen ? "block" : "none";

    _emitter.emit(_isOpen ? "menu:open" : "menu:close");
  }

  ui.expandLeft = function () {
    ($("body").addClass("geofs-expand-left"), geofs.handleResize());
    toggleMenu(false)
  };

  // ─── Keyboard shortcut helpers ────────────────────────────────────────────

  /**
   * Formats a stored shortcut string like "KeyA&,false&,true&,false&,false"
   * into a human-readable label like "Shift+KeyA".
   */
  function formatShortcut(stored) {
    const parts = stored.split("&,");
    if (parts.length === 1) return parts[0]; // legacy plain-key format
    const [code, ctrl, shift, alt, meta] = parts;
    return [
      ctrl === "true" ? "Ctrl+" : "",
      shift === "true" ? "Shift+" : "",
      alt === "true" ? "Alt+" : "",
      meta === "true" ? "Meta+" : "",
      code,
    ].join("");
  }

  function encodeShortcut(e) {
    const mods = ["control", "shift", "alt", "meta"];
    const isModKey = mods.some((m) => e.code.toLowerCase().includes(m));
    return [
      e.code,
      isModKey ? e.code.toLowerCase().includes("control") : e.ctrlKey,
      isModKey ? e.code.toLowerCase().includes("shift") : e.shiftKey,
      isModKey ? e.code.toLowerCase().includes("alt") : e.altKey,
      isModKey ? e.code.toLowerCase().includes("meta") : e.metaKey,
    ].join("&,");
  }

  function shortcutMatches(e, stored) {
    const parts = stored.split("&,");
    if (parts.length === 1) return e.key === parts[0] || e.code === parts[0];
    const [code, ctrl, shift, alt, meta] = parts;
    return (
      e.code === code &&
      e.ctrlKey.toString() === ctrl &&
      e.shiftKey.toString() === shift &&
      e.altKey.toString() === alt &&
      e.metaKey.toString() === meta
    );
  }

  // ─── Section class — one instance per BUIM(name, prefix) call ─────────────

  class Section {
    #prefix;
    #name;
    #defaults = []; // [{ key, defaultValue }]
    #bodyEl = null;
    #enableCheckbox = null;

    /**
     * @param {string} name    - Display name shown in the menu header.
     * @param {string} prefix  - Unique prefix for all localStorage keys in this section.
     */
    constructor(name, prefix) {
      if (!prefix || !name) throw new Error("BUIM: name and prefix are required.");
      this.#name = name;
      this.#prefix = prefix;

      bootstrapMenu(); // idempotent
      this.#buildSection();

      // Ensure the enabled flag has a default
      Store.getOrDefault(this.#key("Enabled"), "true");
    }

    // ── Private helpers ──────────────────────────────────────────────────

    #key(lsName) {
      return this.#prefix + ":" + lsName;
    }

    #buildSection() {
      // Enable checkbox — stop click from bubbling so toggle still fires
      this.#enableCheckbox = el("input", {
        type: "checkbox",
        className: "buim-enable-checkbox",
      });
      this.#enableCheckbox.checked = Store.getBool(this.#key("Enabled"), true);
      this.#enableCheckbox.addEventListener("change", (e) => {
        e.stopPropagation(); // don't collapse the section
        Store.set(this.#key("Enabled"), e.target.checked);
        _emitter.emit(`${this.#prefix}:toggle`, e.target.checked);
      });

      const title = el("h5", { className: "buim-section-title" }, this.#name);

      const arrow = el("span", {
        className: "buim-section-arrow",
        textContent: "▸",
      });

      const header = el("div", { className: "buim-section-header" }, this.#enableCheckbox, title, arrow);

      this.#bodyEl = el("div", { className: "buim-section-body" });

      // Add reset button at the bottom of every section
      const resetBtn = el("button", {
        className: "buim-btn buim-btn-reset",
        textContent: "RESET & REFRESH",
      });
      resetBtn.addEventListener("click", () => this.#resetDefaults());

      this.#bodyEl.appendChild(resetBtn);

      const section = el("div", { className: "buim-section" }, header, this.#bodyEl);

      header.addEventListener("click", () => {
        const open = this.#bodyEl.classList.toggle("open");
        arrow.textContent = open ? "▾" : "▸";
      });

      _menuEl.appendChild(section);
    }

    /** Inserts a child before the reset button (always last). */
    #appendToBody(node) {
      const resetBtn = this.#bodyEl.querySelector(".buim-btn-reset");
      this.#bodyEl.insertBefore(node, resetBtn);
    }

    #resetDefaults() {
      for (const { key, defaultValue } of this.#defaults) {
        Store.set(key, defaultValue);
        const elem = document.getElementById(key);
        if (!elem) continue;
        if (elem.type === "checkbox") {
          elem.checked = defaultValue === "true" || defaultValue === true;
        } else {
          elem.value = defaultValue;
        }
        _emitter.emit(`${elem.id}:change`);
      }
      _emitter.emit(`${this.#prefix}:reset`);

      for (const key in localStorage) {
        if (key.substring(0, this.#prefix.length + 1) == this.#prefix + ":") {
          localStorage.removeItem(key);
        }
      }
      window.location.reload()
    }

    // ── Public API ───────────────────────────────────────────────────────

    /**
     * Listen to section-level events.
     * Built-in events: "toggle" (enabled checkbox changed), "reset".
     * You can also emit your own via section.emit().
     * @returns {function} Unsubscribe function.
     */
    on(event, fn) {
      return _emitter.on(`${this.#prefix}:${event}`, fn);
    }

    emit(event, data) {
      console.log("Emitting on: " + `${this.#prefix}:${event}`);
      _emitter.emit(`${this.#prefix}:${event}`, data);
    }

    /**
     * Adds a text/number/checkbox input row.
     * @param {string} description  - Short label shown next to the input.
     * @param {string} lsName       - camelCase key (auto-prefixed). Also used as element id.
     * @param {"text"|"number"|"checkbox"} type
     * @param {string|number|boolean} defaultValue
     * @returns {Section} this (chainable)
     */
    addItem(description, lsName, type = "text", defaultValue = "") {
      const key = this.#key(lsName);
      const stored = Store.getOrDefault(key, defaultValue);

      this.#defaults.push({ key, defaultValue: String(defaultValue) });

      const input = el("input", {
        id: key,
        type,
        className: type === "checkbox" ? "buim-checkbox" : "buim-input",
      });

      if (type === "checkbox") {
        input.checked = stored === "true";
      } else {
        input.value = stored;
      }

      input.addEventListener("change", () => {
        const value = type === "checkbox" ? input.checked : input.value;
        Store.set(key, value);
        _emitter.emit(`${key}:change`, value);
      });

      const label = el("label", { className: "buim-label", htmlFor: key }, description);
      const row = el("div", { className: "buim-row" }, label, input);
      this.#appendToBody(row);
      return this;
    }

    /**
     * Adds a <select> dropdown row.
     * @param {string} description  - Short label.
     * @param {string} lsName       - camelCase key (auto-prefixed).
     * @param {Record<string,string>} options  - { "Visible Label": "storedValue", … }
     * @param {string} [defaultValue]
     * @returns {Section} this (chainable)
     */
    addDropdown(description, lsName, options, defaultValue) {
      const key = this.#key(lsName);
      const firstVal = Object.values(options)[0] ?? "";
      const stored = Store.getOrDefault(key, defaultValue ?? firstVal);

      this.#defaults.push({
        key,
        defaultValue: String(defaultValue ?? firstVal),
      });

      const select = el("select", { id: key, className: "buim-select" });
      for (const [label, value] of Object.entries(options)) {
        select.appendChild(el("option", { value }, label));
      }
      select.value = stored;

      select.addEventListener("change", () => {
        Store.set(key, select.value);
        _emitter.emit(`${key}:change`, select.value);
      });

      const label = el("label", { className: "buim-label", htmlFor: key }, description);
      const row = el("div", { className: "buim-row" }, label, select);
      this.#appendToBody(row);
      return this;
    }

    /**
     * Adds a plain button.
     * @param {string}   label  - Button text.
     * @param {function} onClick
     * @returns {Section} this (chainable)
     */
    addButton(label, onClick) {
      const btn = el("button", { className: "buim-btn", textContent: label });
      btn.addEventListener("click", onClick);
      this.#appendToBody(btn);
      return this;
    }

    /**
     * Adds a visual sub-heading inside the section body.
     * @param {string}    text
     * @returns {Section} this (chainable)
     */
    addSubHeading(text) {
      this.#appendToBody(el(`label`, { textContent: text, className: "buim-header" }));
      return this;
    }

    /**
     * Adds a keyboard-shortcut binding row.
     *
     * @param {string}   description
     * @param {string}   lsName        - camelCase key (auto-prefixed).
     * @param {string}   defaultValue  - e.g. "KeyG&,false&,false&,false&,false" or plain "KeyG"
     * @param {function} onKeyDown     - called when the shortcut is pressed.
     * @param {function} [onKeyUp]     - optional; called when the key is released.
     * @returns {Section} this (chainable)
     */
    addShortcut(description, lsName, defaultValue, onKeyDown, onKeyUp) {
      const key = this.#key(lsName);
      const stored = Store.getOrDefault(key, defaultValue);
      this.#defaults.push({ key, defaultValue });

      const btn = el("button", {
        id: key,
        className: "buim-shortcut-btn",
        textContent: formatShortcut(stored),
      });

      // Click starts listening for a new key
      btn.addEventListener("click", () => {
        if (btn.classList.contains("listening")) return;
        btn.classList.add("listening");
        btn.textContent = "Press any key…";

        const capture = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const encoded = encodeShortcut(e);
          Store.set(key, encoded);
          btn.textContent = formatShortcut(encoded);
          btn.classList.remove("listening");
          document.removeEventListener("keyup", capture, true);
        };
        document.addEventListener("keyup", capture, {
          capture: true,
          once: true,
        });
      });

      // Global key listener for this shortcut
      document.addEventListener("keydown", (e) => {
        if (shortcutMatches(e, Store.get(key) ?? defaultValue) && this.isEnabled) onKeyDown(e);
      });
      if (onKeyUp) {
        document.addEventListener("keyup", (e) => {
          if (shortcutMatches(e, Store.get(key) ?? defaultValue)) onKeyUp(e);
        });
      }

      const label = el("label", { className: "buim-label" }, description);
      const row = el("div", { className: "buim-row" }, label, btn);
      this.#appendToBody(row);
      return this;
    }

    // ── Convenience getters ──────────────────────────────────────────────

    /** Returns the raw stored string for lsName. */
    get(lsName) {
      return Store.get(this.#key(lsName));
    }

    /** Returns a boolean for a checkbox-backed setting. */
    getBool(lsName) {
      return Store.getBool(this.#key(lsName));
    }

    /** Programmatically update a stored value and sync the input element. */
    set(lsName, value) {
      const key = this.#key(lsName);
      Store.set(key, value);
      const elem = document.getElementById(key);
      if (!elem) return;
      if (elem.type === "checkbox") elem.checked = value === "true" || value === true;
      else elem.value = value;
    }

    /** Whether this section is enabled (the top-level checkbox). */
    get isEnabled() {
      return Store.getBool(this.#key("Enabled"), true);
    }
  }

  // ─── Module-level events exposed for orchestration ────────────────────────

  const publicApi = Section; // The class IS the public API

  /**
   * Subscribe to global menu open/close events.
   * Usage: BUIM.on("menu:open", () => { ... })
   */
  publicApi.on = (event, fn) => _emitter.on(event, fn);
  publicApi.emit = (event, data) => _emitter.emit(event, data);

  /** Programmatically open or close the menu. */
  publicApi.toggle = () => {
    if (_isBootstrapped) toggleMenu();
  };

  // Signal that BUIM is ready (mirrors the original window.fireBasicEvent pattern
  // without depending on an external function that may not exist).
  const readyEvent = new CustomEvent("BUIMLoaded", { bubbles: true });
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      document.dispatchEvent(readyEvent);
    },
    { once: true },
  );

  return publicApi;
})();
