const DESIGN = {
  CSS: `
        .buim-dropdown {
            margin: 5px;
            border-radius: 4px;
            background: linear-gradient(to bottom, black 0%, rgb(0 0 0 / 0%));
            backdrop-filter: blur(10px);
        }
        .buim-header {
            padding: 10px;
            margin: 5px;
            cursor: pointer;
            user-select: none;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: left;
        }
        .buim-header:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        .buim-content {
            display: none;
            padding: 10px;
            border-top: 1px solid #444444ff;
        }
        .buim-content-visible {
            display: block !important;
        }
        #buim_gamenu {
            padding: 0;
            cursor: pointer; /* optional */
        }
        
        .buim-menu {
            position: absolute;
            left: 0.625rem;
            top: 3.125rem;
            width: 350px;
            min-width: 150px;
            background: rgba(0,0,0,0.75);
            z-index: 9999;
            font-size: 13px;
            padding: 6px 12px;
            backdrop-filter: blur(5px);
            color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.4);
            cursor: pointer;
            opacity: 1;
            transition: opacity 0.3s;
            text-align: center;
        }
    `,
  HTML: {
    optionsMenuTitle: `
          <h3>Bespoke Client. </h3>
          <h6>An <strong>Eschaton Project.</strong></p>
          <p>Made by Zeta. <i>@zetainbeta_43414 on Discord</i></p>
        `,
    individualDropdown: function (prefix, name, html) {
      return `
            <div class="buim-dropdown" style="color: white;">
              <div class="buim-header" onclick="document.getElementById('${prefix}Content').classList.toggle('buim-content-visible')">
                <input id="${prefix}Enabled" type="checkbox" 
                        checked="${
                          localStorage.getItem(prefix + "Enabled") == "true"
                        }" 
                        onchange="localStorage.setItem('${prefix}Enabled', this.checked); 
                                window.dispatchEvent(new Event('${prefix}Toggled'));" 
                        onclick="event.stopPropagation()"
                        style="width: 30px; height: 30px;">  
                <h5 style="display: inline-block; margin: 15px; color: white;">${name}</h5>
              </div>
              <div id="${prefix}Content" class="buim-content">
                ${html}
                <br>
                <button id="${prefix}Reset">RESET</button>
              </div>
            </div>
          `;
    },
    item: function (level, description, idName, type) {
      return `
            <span style=" text-indent: ${level}rem">${description}</span>
            <input id="${idName}" type="${type}" onchange="localStorage.setItem('${idName}', ${
        type === "checkbox" ? "this.checked" : "this.value"
      })  ">
            <br>
          `;
    },
    button: function (prefix, title, options, fn) {
      return `<button id="${prefix}${title}" ${
        options || ""
      } onclick="${fn}()">${title}</button><br>`;
    },
    dropdown: function (lsName, title, values) {
      let options = "";
      Object.keys(values).forEach((name) => {
        options =
          options + "\n" + `<option value="${values[name]}">${name}</option>`;
      });
      return `
            <label for="${lsName}">${title}</label>
            <select id="${lsName}" onchange="localStorage.setItem('${lsName}', this.value);">
                ${options}
            </select>
            <script>
                // Set initial selected value from localStorage (if it exists)
                (function() {
                    var saved = localStorage.getItem("${lsName}");
                    if (saved !== null) {
                        document.getElementById("${lsName}").value = saved;
                    }
                })();
            </script>
            <br>
        `;
    },
    header: function (level, text) {
      return `<h${level}>${text}</h${level}>`;
    },
    openBuimBtn: `
      <div id="bottomDiv">
        <div id="buim_gamenu" class="mdl-button mdl-js-button geofs-f-standard-ui">
            BESPOKE
        </div>
      </div>
    `,
  },
};

if (!window._buim) {
  window._buim = {};
  console.log("Created BUIM");
}
window._buim.isGMenuInit = false; // This will be set to true when the first GMenu is added
window._buim.isOpen = false;
window._buim.allHTML = []; // All HTML blocks
window._buim.allLS = []; //All localStorage values (it's a 2d array: [lsValue_str, isCheckbox_bool])

/**
 * Waits for an element to be created, then resolves.
 * @param {string} selector - The query selector
 * @returns {Element} The element from the query selector.
 */
window._buim.waitForElm = function (selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

window._buim.toggleMenu = function () {
  console.log("Toggling Menu");
  if (window._buim.isOpen) {
    window._buim.isOpen = false;
    window._buim.menuDiv.style.display = "none";
  } else {
    window._buim.isOpen = true;
    window._buim.menuDiv.style.display = "block";
    for (let i = 0; i < window._buim.allLS.length; i++) {
      let currLS = window._buim.allLS[i];
      currLS[1]
        ? (document.getElementById(currLS[0]).checked =
            localStorage.getItem(currLS[0]) == "true")
        : (document.getElementById(currLS[0]).value = localStorage.getItem(
            currLS[0]
          ));
    }
  }
};

/**
 * Compiles all the HTML in `window.gmenu.allHTML` and sorts them alphabetically.
 */
window._buim.compileAllHTML = function () {
  window._buim.menuDiv.innerHTML = DESIGN.HTML.optionsMenuTitle;

  for (let i = 0; i < window._buim.allHTML.length; i++) {
    window._buim.menuDiv.innerHTML += window._buim.allHTML[i];
  }
};

/**
 * In a nutshell, this function handles shortcut changes when the user presses a shortcut button.
 * @param {string} id - The id of the element to be changed, which should also be the localStorage id.
 */
window.gmenu.changeShortcut = function (id) {
  console.log(id);
  let btn = document.getElementById(id);
  if (btn.innerHTML !== "Press any key...") {
    btn.innerHTML = "Press any key...";
    btn.classList.add("gmenu-edit");
    function listen(e) {
      let ovrrd = [
        e.code.toLowerCase().includes("control"),
        e.code.toLowerCase().includes("shift"),
        e.code.toLowerCase().includes("alt"),
        e.code.toLowerCase().includes("meta"),
      ];
      localStorage.setItem(
        id,
        `${e.code}&,${ovrrd[0] ? "true" : e.ctrlKey.toString()}&,${
          ovrrd[1] ? "true" : e.shiftKey.toString()
        }&,${ovrrd[2] ? "true" : e.altKey.toString()}&,${
          ovrrd[3] ? "true" : e.metaKey.toString()
        }`
      );
      btn.classList.remove("gmenu-edit");
      btn.innerHTML = `${e.ctrlKey && !ovrrd[0] ? "Ctrl+" : ""}${
        e.shiftKey && !ovrrd[1] ? "Shift+" : ""
      }${e.altKey && !ovrrd[2] ? "Alt+" : ""}${
        e.metaKey && !ovrrd[3] ? "Meta+" : ""
      }${e.code}`;
      btn.removeEventListener("keyup", listen);
    }
    btn.addEventListener("keyup", listen);
  }
};

/**
 * An easy way to retrieve stored settings.
 * @param {string} id - The addon's unique identifier
 * @param {string} name - The setting's identifier
 * @returns The value as requested
 */
window.gmenu.get = function (id, name) {
  let type = window.gmenu.lookupTable[id + name];
  if (type == "boolean") {
    return localStorage.getItem(id + name) == "true";
  }
  if (type == "Number") {
    return Number(localStorage.getItem(id + name));
  }
  return localStorage.getItem(id + name);
};

window.BUIM = class {
  // Bespoke User Interface Manager
  constructor(name, prefix) {
    this.defaults = [];
    this.name = name;
    this.prefix = prefix;
    if (!window._buim.isGMenuInit) {
      this.initialize();
    }
    this.html = ``; //This HTML will be enclosed in a Div; Instead of adding to the main HTML directly, methods add to this HTML.
    this.htmlIndex = window._buim.allHTML.length; //This instance's index in the allHTML array
  }

  /**
   * Called automatically, initializes the button, menu div, and a couple of other things
   */
  initialize() {
    window._buim.isGMenuInit = true; //Prevent other instances from initializing this window
    var bottomDiv = document.getElementsByClassName("geofs-ui-bottom")[0];
    window._buim.btn = document.createElement("div");
    window._buim.btn.id = "buim_gamenu";
    window._buim.btn.classList = "mdl-button mdl-js-button geofs-f-standard-ui";
    window._buim.btn.style.padding = "0px";
    bottomDiv.appendChild(window._buim.btn);
    window._buim.btn.innerHTML = DESIGN.HTML.openBuimBtn;
    document.getElementById("buim_gamenu").onclick = () => {
      window._buim.toggleMenu();
    };
    if (!window._buim.menuDiv) {
      window._buim.menuDiv = document.createElement("div");
      window._buim.menuDiv.id = "ggamergguyDiv"; // tribute to the chad who made the skeleton that BUIM is made on
      //window._buim.menuDiv.classList = "geofs-list geofs-toggle-panel geofs-preference-list geofs-preferences";
      window._buim.menuDiv.classList = "buim-menu";
      window._buim.menuDiv.style.zIndex = "100";
      window._buim.menuDiv.style.display = "none";
      document.body.appendChild(window._buim.menuDiv);

      // Add styles for BUIM dropdowns
      const style = document.createElement("style");
      style.textContent = DESIGN.CSS;
      document.head.appendChild(style);
    }
  }

  /**
   * Updates the menu's HTML if and only if the GMenu is closed.
   * @returns {boolean} true if the GMenu was closed and it was able to update the HTML, false otherwise
   */
  updateHTML() {
    if (!window._buim.isOpen) {
      // <span>Enabled: </span>
      window._buim.allHTML[this.htmlIndex] = DESIGN.HTML.individualDropdown(
        this.prefix,
        this.name,
        this.html
      );

      window._buim.compileAllHTML();

      if (localStorage.getItem(this.prefix + "Enabled") == null) {
        localStorage.setItem(this.prefix + "Enabled", "true");
      }

      window._buim.waitForElm(`#${this.prefix}Reset`).then((elm) => {
        setTimeout(() => {
          document.getElementById(this.prefix + "Enabled").checked =
            localStorage.getItem(this.prefix + "Enabled") == "true";

          document
            .getElementById(this.prefix + "Reset")
            .addEventListener("click", () => {
              for (let i = 0; i < this.defaults.length; i++) {
                let currD = this.defaults[i]; //currD[0] = idName, currD[1] = defaultValue, currD[2] = isCheckbox
                localStorage.setItem(currD[0], currD[1]);

                if (currD[2]) {
                  //if it's a checkbox
                  document.getElementById(currD[0]).checked = currD[1];
                } else {
                  document.getElementById(currD[0]).value = currD[1];
                }
              }
              window._buim.toggleMenu();
              window._buim.toggleMenu(); //Reload the menu
            });
        }, 500);
      });
      return true;
    }
    return false;
  }

  //Note: The defaultValue should always be a string, and ALL LOCALSTORAGE VALUES ARE STRINGS. This means that checkbox values, for instance, will be either "true" or "false", and number values will be converted into strings.
  /**
   * Adds an input item to the menu.
   * @param {string} description - A very short (<5 words) description
   * @param {string} lsName - The name used for local storage retrieval/storage (also the id name), will be automatically prefixed by the prefix. It should be in camel case with the first letter capitalized.
   * @param {string} type - Any of the standared HTML input types, defaults to text
   * @param {number} level - The indentation level of the item, where 0 is no indentation, defaults to 0
   * @param {*} defaultValue - The value of the setting that will be used upon the user's first time using the addon
   * @param {string} options - Optional HTML attributes for the input
   */
  addItem(description, lsName, type, level, defaultValue) {
    console.log(`Adding ${type}... ${defaultValue} (${lsName})`);
    let idName = this.prefix + lsName;
    this.defaults.push([idName, defaultValue, type == "checkbox"]); //Checkboxes are... "special." (elem.value doesn't work on them, they require elem.checked)

    if (localStorage.getItem(idName) == null) {
      localStorage.setItem(idName, defaultValue);
    }
    window._buim.allLS.push([idName, type == "checkbox"]);
    this.html += DESIGN.HTML.item(level, description, idName, type);

    this.updateHTML();
  }

  /**
   * Adds a button to the menu.
   * @param {string} title - The button's title
   * @param {function} fn - A function to be run when the button is clicked
   * @param {string} options - Optional HTML attributes
   */
  addButton(title, fn, options) {
    console.log(`Adding Button... ${title}`);
    this.html += DESIGN.HTML.button(this.prefix, title, options, fn);
    this.updateHTML();
    //document.getElementById(this.prefix + title).onclick = fn;
  }

  addDropdown(label, lsName, options) {
    // Options is an object with keys as visible names and the values as Labels.
    // Like {"Youtube": "https://youtube.com/", "Google": "https://google.com"}
    // Only "Youtube" and "Google" are shown but the URL is shows in the saved value.
    // Both in local storage and in the element itself "value"
    console.log(`Adding Dropdown... ${label}`);
    this.html += DESIGN.HTML.dropdown(lsName, label, options);
    this.updateHTML();
  }

  /**
   * Adds a header of the specified level
   * @param {number} level - The header's level (1 for h1, 2 for h2, 3 for h3, etc.). It is reccomended to start at 2 as h1 is used for the addon titles.
   * @param {string} text - The header's text contents
   */
  addHeader(level, text) {
    console.log(`Adding Header... ${text}`);
    this.html += DESIGN.HTML.header(level, text);
    this.updateHTML();
  }

  /**
   * Adds a keyboard shortcut to the menu (this method is similar to the addItem method, but is specifically meant for handling keyboard shortcuts).
   * @param {string} description - A very short (<5 words) description
   * @param {string} lsName - The name used for local storage retrieval/storage (also the id name), will be automatically prefixed by the prefix. It should be in camel case with the first letter capitalized.
   * @param {number} level - The indentation level of the item, where 0 is no indentation, defaults to 0
   * @param {string} defaultValue - The default value, prefferably in the format `keyCode`&,`ctrlKey`&,`shiftKey`&,`altKey`&,`metaKey` but also acceptable in the format `keyCode` or `key`.
   * @param {function} fn - The function to be executed when the shortcut is pressed
   */
  addKBShortcut(description, lsName, level = 0, defaultValue, fn) {
    let idName = this.prefix + lsName;
    this.defaults.push([idName, defaultValue, false]);
    if (localStorage.getItem(idName) == null) {
      console.log(idName + " is null, setting to " + defaultValue);
      localStorage.setItem(idName, defaultValue);
    }
    window.gmenu.allLS.push([idName, false]);
    let tester = localStorage.getItem(idName).split("&,");
    let oldSave = tester.length == 1;
    let e = oldSave
      ? {
          code: tester[0],
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
        }
      : {
          code: tester[0],
          ctrlKey: tester[1] == "true",
          shiftKey: tester[2] == "true",
          altKey: tester[3] == "true",
          metaKey: tester[4] == "true",
        };
    this.html += `<span style="padding-left: ${level}rem">${description}</span>
    <button id="${
      this.prefix + lsName
    }" class="gmenu-sc" onclick="window.gmenu.changeShortcut('${
      this.prefix + lsName
    }')">${e.ctrlKey ? "Ctrl+" : ""}${e.shiftKey ? "Shift+" : ""}${
      e.altKey ? "Alt+" : ""
    }${e.metaKey ? "Meta+" : ""}${e.code}</button><br>`;
    this.updateHTML();
    function t(event) {
      //I used 't' for the function name for no particular reason
      let tester = localStorage.getItem(idName).split("&,");
      let oldSave = tester.length == 1;
      if (
        (event.key == tester[0] || event.code == tester[0]) &&
        (oldSave ||
          (event.ctrlKey.toString() == tester[1] &&
            event.shiftKey.toString() == tester[2] &&
            event.altKey.toString() == tester[3] &&
            event.metaKey.toString() == tester[4]))
      ) {
        console.log(event.key + " pressed");
        fn();
      }
    }
    document.addEventListener("keydown", t);
  }
};

window.fireBasicEvent('GMenuLoaded');