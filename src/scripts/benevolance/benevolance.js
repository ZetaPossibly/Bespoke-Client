(function() {
    const commonCSS = document.styleSheets[2];
    const defaultCSS = document.styleSheets[2].cssRules; 

    let prefix = "benevolance"
    mapTilesets = {
        "CartoDB Dark": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "Default GeoFS": "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "OSM": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    }
    function apply_styles() {
        for (let rule of commonCSS.cssRules) {
            if (rule.selectorText === ".geofs-transparentUI .geofs-map-viewport") {
                rule.style.setProperty("-webkit-mask-image", "linear-gradient(90deg, #ffffffe0 100%, #ffffff00 100%)");         // Change a property
                rule.style.setProperty("backdrop-filter", "blur(10px)");
            }

            if (rule.selectorText === ".geofs-transparentUI .geofs-ui-bottom") {
                rule.style.setProperty("background-color", "#0000005e");         // Change a property
                rule.style.setProperty("backdrop-filter", "blur(5px)");
            }

            // .geofs-expand-left.geofs-transparentUI .geofs-chat-messages
            if (rule.selectorText === ".geofs-expand-left.geofs-transparentUI .geofs-chat-messages") {
                rule.style.setProperty("left", "38%");         // Change a property
            }

            // .geofs-transparentUI .geofs-list background: #0000003b; backdrop-filter:blur(5px)
            if (rule.selectorText === ".geofs-transparentUI .geofs-list") {
                rule.style.setProperty("background", "#0000003b");
                rule.style.setProperty("backdrop-filter", "blur(5px)");
            }

            if (rule.selectorText === ".geofs-transparentUI #Qantas94Heavy-ap") {
                rule.style.setProperty("background-color", "#000000");
                rule.style.setProperty("backdrop-filter", "blur(5px)");
            }

            // html colour white
            if (rule.selectorText === "html") {
                rule.style.setProperty("color", "rgb(255 255 255 / 87%)");
            }

            //.geofs-preferences fieldset box-shadow: 1px 1px 10px #00000085;
            if (rule.selectorText === ".geofs-preferences fieldset") {
                rule.style.setProperty("box-shadow", "none");
                rule.style.setProperty("border", "none");
                rule.style.setProperty("background", "transparent");
                rule.style.setProperty("border-radius", "10px");
            }
            // .geofs-preferences legend colour white
            if (rule.selectorText === ".geofs-preferences legend") {
                rule.style.setProperty("color", "white");
            }
            if (rule.selectorText === ".mdl-button") {
                rule.style.setProperty("color", "white")
            }

            if (rule.selectorText === ".slider label") {
                rule.style.setProperty("colour", "#d2d2d2ff")
            }
        }
        //geofs.api.map._map._layers["25"]._url = localStorage.getItem(prefix+"Tileset") || mapTilesets["CartoDB Dark"]
        geofs.api.map._map._layers["25"].setUrl(localStorage.getItem(prefix+"Tileset") || mapTilesets["CartoDB Dark"])
    }

    // Loop through all CSS rules in the sheet
    if (localStorage.getItem(prefix+"Enabled") === "true") {    
        apply_styles()
    }


    var toGo = document.getElementsByClassName('geofs-datasourceSelector');
    while(toGo[0]) {
        toGo[0].parentNode.removeChild(toGo[0]);
    }

    toGo = document.getElementsByClassName('geofs-debug-info')
    while(toGo[0]) {
        toGo[0].parentNode.removeChild(toGo[0]);
    }


    let benevolanceUi = new window.BUIM("Benevolance", prefix)

    geofs.api.map._map._fadeAnimated = false
    geofs.api.map._map.options.maxZoom = 19
    geofs.api.map._map._panes.mapPane.parentElement.style.background = "black"

    window.addEventListener(prefix+"Toggled", function() {
        // Reset all modified styles to default
        if (localStorage.getItem("benevolanceEnabled") === "false") {
            for (let i = 0; i < commonCSS.cssRules.length; i++) {
                const rule = commonCSS.cssRules[i];
                const defaultRule = defaultCSS[i];

                // Loop through all style properties of the rule
                for (let j = 0; j < defaultRule.style.length; j++) {
                    const propertyName = defaultRule.style[j];
                    const defaultValue = defaultRule.style.getPropertyValue(propertyName);
                    rule.style.setProperty(propertyName, defaultValue);
                }
            }
            //geofs.api.map._map._layers["25"]._url = mapTilesets["Default GeoFS"]
            geofs.api.map._map._layers["25"].setUrl(mapTilesets["Default GeoFS"])
        } else {
            apply_styles()
        }
    });

    benevolanceUi.addDropdown("Map Tileset (move the map to update)", prefix+"Tileset", mapTilesets)
    window._buim.waitForElm(`#${prefix}Tileset`).then((elm) => {
        document.getElementById(prefix+"Tileset").addEventListener("change", function() {
            //geofs.api.map._map._layers["25"]._url = localStorage.getItem(prefix+"Tileset")
            geofs.api.map._map._layers["25"].setUrl(localStorage.getItem(prefix+"Tileset"))
        })
    });


    benevolanceUi.addItem("Remove Foos", "RemoveFoos", "checkbox", "true")
    document.getElementById(prefix+"RemoveFoos").addEventListener("change", function() {
        multiplayer.stop()
        multiplayer.start()  
    })

    // localStorage.getItem(prefix+"RemoveFoos") === "true"
    geofs.map.addPlayerMarker = function(e, t, a) {
        if (!ui.playerMarkers[e]) {
            var o = {
                coords: [0, 0],
                icon: geofs.api.map.getIcon(t, geofs.map.icons[t || "blue"]),
                label: a || "-"
            };
            if (localStorage.getItem(prefix+"RemoveFoos") === "true") {
                if (o.label !== "-" && multiplayer.users[e].callsign !== "Foo" && multiplayer.users[e].callsign !== "") {
                    ui.playerMarkers[e] = new geofs.api.map.marker(o)
                }
            } else {
                ui.playerMarkers[e] = new geofs.api.map.marker(o)
            }
        }

        if (localStorage.getItem(prefix+"RemoveFoos") === "true") {
            if (o.label !== "-" && multiplayer.users[e].callsign !== "Foo" && multiplayer.users[e].callsign !== "") {
                return geofs.api.map._map && this.mapActive && ui.playerMarkers[e].addToMap(),
                ui.playerMarkers[e]
            }
        } else {
            return geofs.api.map._map && this.mapActive && ui.playerMarkers[e].addToMap(),
            ui.playerMarkers[e]
        }
    }

})();
