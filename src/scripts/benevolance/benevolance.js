(function() {
    let prefix = "benevolance"
    mapTilesets = {
        "CartoDB Dark": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "Google": "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "GeoFS": "https://data.geo-fs.com/osm/{z}/{x}/{y}.png",
        "OSM": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    }
    function apply_styles() {
        const style = document.createElement("style");
        style.id = "BespokeTheme"
        style.textContent = `
            .geofs-transparentUI .geofs-map-viewport {
                -webkit-mask-image: linear-gradient(90deg, #ffffffe0 100%, #ffffff00 100%);
                backdrop-filter: blur(10px);
            }

            .geofs-transparentUI .geofs-ui-bottom {
                background-color: #0000005e;
                backdrop-filter: blur(5px);
            }

            .geofs-expand-left.geofs-transparentUI .geofs-chat-messages {
                left: 38%;
            }

            .geofs-transparentUI .geofs-list {
                background: #0000003b;
                backdrop-filter: blur(5px);
            }

            .geofs-transparentUI #Qantas94Heavy-ap {
                background-color: #000000;
                backdrop-filter: blur(5px);
            }

            html {
                color: rgb(255 255 255 / 87%);
            }

            .geofs-preferences fieldset {
                box-shadow: none;
                border: none;
                background: transparent;
                border-radius: 10px;
            }

            .geofs-preferences legend {
                color: white;
            }

            .mdl-button {
                color: white;
            }

            .slider label {
                color: #d2d2d2ff;
            }
        `;

        document.head.appendChild(style);

        geofs.api.map._map._layers["25"].setUrl(
            localStorage.getItem(prefix + "Tileset") || mapTilesets["CartoDB Dark"]
        );
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

    benevolanceUi.addItem("Fade in map tiles", "FadeMapTiles", "checkbox", "true")
    let check_fade = function() {
        if (localStorage.getItem(prefix+"FadeMapTilesEnabled") === "true") {
            geofs.api.map._map._fadeAnimated = true
        } else { geofs.api.map._map._fadeAnimated = false }
    }
    check_fade()
    window.addEventListener(prefix+"FadeMapTiles", function() {
        check_fade()
    })

    geofs.api.map._map.options.maxZoom = 19
    geofs.api.map._map._panes.mapPane.parentElement.style.background = "black"

    window.addEventListener(prefix+"Toggled", function() {
        if (localStorage.getItem("benevolanceEnabled") === "false") {
            document.getElementById("BespokeTheme")?.remove()
            geofs.api.map._map._layers["25"].setUrl(mapTilesets["Default GeoFS"])
        } else {
            apply_styles()
        }
    });

    benevolanceUi.addDropdown("Map Tileset (move the map to update)", "Tileset", mapTilesets)
    window._buim.waitForElm(`${prefix}Tileset`).then((elm) => {
        document.getElementById(prefix+"Tileset").addEventListener("change", function() {
            geofs.api.map._map._layers["25"].setUrl(localStorage.getItem(prefix+"Tileset"))
        })
    });


    benevolanceUi.addItem("Remove Foos", "RemoveFoos", "checkbox", "true")
    document.getElementById(prefix+"RemoveFoos").addEventListener("change", function() {
        multiplayer.stop()
        multiplayer.start()  
    })

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
