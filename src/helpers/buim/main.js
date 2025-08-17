(function () {
  "use strict";
  if (!window._buim) {
    window._buim = {};
  }
  window._buim.isGMenuInit = false; // This will be set to true when the first GMenu is added
  window._buim.isOpen = false;
  window._buim.allHTML = []; // All HTML blocks
  window._buim.allLS = []; //All localStorage values (it's a 2d array: [lsValue_str, isCheckbox_bool])
})();
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

window._buim.compileAllHTML = function () {
  window._buim.menuDiv.innerHTML = ``; //Clear the HTML to refresh it
  for (let i = 0; i < window._buim.allHTML.length; i++) {
    let h = window._buim.allHTML[i]; //Current block of HTML
    window._buim.menuDiv.innerHTML += `<div>`; //Inner div
    window._buim.menuDiv.innerHTML += h;
    window._buim.menuDiv.innerHTML += `<div style="background: darkgray; height: 2px; margin: 10px;"></div></div>`;
  }
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

  // Called automatically, initializes the button, menu div, and a couple of other things
  initialize() {
    window._buim.isGMenuInit = true; //Prevent other instances from initializing this window
    var bottomDiv = document.getElementsByClassName("geofs-ui-bottom")[0];
    window._buim.btn = document.createElement("div");
    window._buim.btn.id = "gamenu";
    window._buim.btn.classList = "mdl-button mdl-js-button geofs-f-standard-ui";
    window._buim.btn.style.padding = "0px";
    bottomDiv.appendChild(window._buim.btn);
    window._buim.btn.innerHTML = `<img src="https://raw.githubusercontent.com/tylerbmusic/GPWS-files_geofs/refs/heads/main/s_icon.png" style="width: 30px">`;
    document.getElementById("gamenu").onclick = () => {
      window._buim.toggleMenu();
    };
    if (!window._buim.menuDiv) {
      window._buim.menuDiv = document.createElement("div");
      window._buim.menuDiv.id = "ggamergguyDiv";
      window._buim.menuDiv.classList =
        "geofs-list geofs-toggle-panel geofs-preference-list geofs-preferences";
      window._buim.menuDiv.style.zIndex = "100";
      window._buim.menuDiv.style.position = "fixed";
      window._buim.menuDiv.style.width = "30%";
      document.body.appendChild(window._buim.menuDiv);
      
      // Add styles for BUIM dropdowns
      const style = document.createElement('style');
      style.textContent = `
        .buim-dropdown {
          border: 1px solid #444;
          margin: 5px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.7);
        }
        .buim-header {
          padding: 10px;
          cursor: pointer;
          user-select: none;
        }
        .buim-header:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .buim-content {
          display: none;
          padding: 10px;
          border-top: 1px solid #444;
        }
        .buim-content-visible {
          display: block !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  updateHTML() {
    if (!window._buim.isOpen) {
      window._buim.allHTML[this.htmlIndex] = `
            <div class="buim-dropdown">
              <div class="buim-header" onclick="document.getElementById('${this.prefix}Content').classList.toggle('buim-content-visible')">
                <h1 style="display: inline-block; margin-right: 10px;">${this.name}</h1>
                <span>Enabled: </span>
                <input id="${this.prefix}Enabled" type="checkbox" checked="${
        localStorage.getItem(this.prefix + "Enabled") == "true"
      }" onchange="localStorage.setItem('${
        this.prefix
      }Enabled', this.checked)" style="width: 30px; height: 30px;">
              </div>
              <div id="${this.prefix}Content" class="buim-content">
                ${this.html}
                <button id="${this.prefix}Reset">RESET</button>
              </div>
            </div>
            `;
      window._buim.compileAllHTML();
      if (localStorage.getItem(this.prefix + "Enabled") == null) {
        localStorage.setItem(this.prefix + "Enabled", "true");
      }
      window._buim.waitForElm(`#${this.prefix}Reset`).then((elm) => {
        setTimeout(() => {
          console.log("Menu stuff added");
          document.getElementById(this.prefix + "Enabled").checked =
            localStorage.getItem(this.prefix + "Enabled") == "true";

          console.log(document.getElementById(this.prefix + "Reset"));
          document
            .getElementById(this.prefix + "Reset")
            .addEventListener("click", () => {
              console.log(this.prefix + " reset");
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
          console.log(document.getElementById(this.prefix + "Reset").onclick);
        }, 500);
      });
      return true;
    }
    return false;
  }

  //Note: The defaultValue should always be a string, and ALL LOCALSTORAGE VALUES ARE STRINGS. This means that checkbox values, for instance, will be either "true" or "false".
  //Adds an item to the menu. Options: description: String, a very short description;  lsName: String, the name used for localStorage retrieval/storage (also the id name), will be automatically prefixed by the prefix;  type: any of the standard HTML input types;  level: Integer, the indentation of the item, where 0 is no indentation;  defaultValue: Self explanatory, the value if the item was not set or was reset
  addItem(description, lsName, type, level, defaultValue, options) {
    let idName = this.prefix + lsName;
    this.defaults.push([idName, defaultValue, type == "checkbox"]); //Checkboxes are... "special." (elem.value doesn't work on them, they require elem.checked)
    if (localStorage.getItem(idName) == null) {
      localStorage.setItem(idName, defaultValue);
    }
    window._buim.allLS.push([idName, type == "checkbox"]);
    if (type !== "checkbox") {
      options == options || "";
      this.html += `
            <span style=" text-indent: ${level}rem">${description}</span>
            <input id="${idName}" type="${type}" onchange="localStorage.setItem('${idName}', this.value)">
            <br>
            `;
    } else {
      //if (type == "checkbox")
      this.html += `
            <span style="text-indent: ${level}rem">${description}</span>
            <input id="${idName}" type="${type}" onchange="localStorage.setItem('${idName}', this.checked)" 
                style="width: 30px; height: 30px;">
            <br>
            `;
    }
    this.updateHTML();
  }

  //Adds a keyboard shortcut to the menu (this method is similar to the addItem method, but adds a keydown listener and function).
  addKBShortcut(description, lsName, level, defaultValue, fn) {
    let idName = this.prefix + lsName;
    this.defaults.push([idName, defaultValue, false]);
    if (localStorage.getItem(idName) == null) {
      console.log(idName + " is null, setting to " + defaultValue);
      localStorage.setItem(idName, defaultValue);
    }
    window._buim.allLS.push([idName, false]);
    this.html += `<span style="text-indent: ${level}rem">${description}</span>
        <input id="${idName}" type="text" onchange="localStorage.setItem('${idName}', this.value)"><br>`;
    this.updateHTML();
    document.addEventListener("keydown", function (event) {
      if (
        event.key == localStorage.getItem(idName) ||
        event.code == localStorage.getItem(idName)
      ) {
        //The user can either type in the key or the code
        console.log(event.key + " pressed");
        fn();
      }
    });
  }

  //Adds a button to the menu. Options: title: String, the button's title; fn: A function to be run when the button is clicked
  addButton(title, fn, options) {
    this.html += `<button id="${this.prefix}${title}" ${
      options || ""
    }>${title}</button><br>`;
    this.updateHTML();
    document.getElementById(this.prefix + title).onclick = fn;
  }

  //Adds a header of the specified level (from 1 to 6, but it is recommended to start at 2 as h1 is used for the addon titles)
  addHeader(level, text) {
    this.html += `<h${level}>${text}</h${level}>`;
    this.updateHTML();
  }
};
