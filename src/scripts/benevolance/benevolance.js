(function() {
    let mapTilesets = {
        "CartoDB Dark": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "Google": "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "GeoFS": "https://data.geo-fs.com/osm/{z}/{x}/{y}.png",
        "GeoFS 4.0": "https://data.geo-fs.com/osm25/{z}/{x}/{y}.png",
        "Allidade Dark": "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
        "ESRI Satellite": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        "Earth at Night": "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.jpg",
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

            .geofs-user-dialog {
                background-color: #0000005e;
                backdrop-filter: blur(5px);
                padding: 5px;
                font_size: 15px;
            }
            
            .geofs-haring {
                background-color: #0000007e;
                backdrop-filter: blur(10px);
                border-radius: 30px;
                margin: 2px;
                width: 40%;
                box-shadow: none !important;

            }
            .geofs-closeHaring {
                top: 15%;
                height: 75%;
                background-color: #000000ca;
                backdrop-filter: blur(10px);
                border-radius: 30px
            }
            .leaflet-popup-content-wrapper {
                background-color: #000000ca;
                backdrop-filter: blur(10px);
            }
            .mdl-chip {
                background-color: #000000ca;
                backdrop-filter: blur(10px);
            }
        `;

        document.head.appendChild(style);

        geofs.api.map._map._layers["25"].setUrl(
            benevolanceUi.get("MapStyle") || mapTilesets["CartoDB Dark"]
        );

        geofs.api.map._map.options.maxZoom = 19
        geofs.api.map._map._panes.mapPane.parentElement.style.background = "black"
        change_map_tileset(benevolanceUi.get("MapStyle") || mapTilesets["GeoFS"])
    }

    function remove_styles() {
        geofs.api.map._map.options.maxZoom = 13
        geofs.api.map._map._panes.mapPane.parentElement.style.background = ''
        document.getElementById("BespokeTheme")?.remove()
        change_map_tileset(mapTilesets["GeoFS"])
    }

    let prefix = "benevolance"
    let benevolanceUi = new window.BUIM("Benevolance", prefix)
    benevolanceUi
        .addDropdown("Map Style", "MapStyle", mapTilesets, mapTilesets["GeoFS"])
        .addItem("Remove Foos from NAV", "RemoveFoos", "checkbox", false)
    
    let restart_mp = function () {
        multiplayer.stop()
        setTimeout(() => {
            multiplayer.stop()
        }, 500)
    }
    
    let change_map_tileset = function(url) {
        if (benevolanceUi.isEnabled) {
            geofs.api.map._map._layers["25"].setUrl(url)
        } else {
            geofs.api.map._map._layers["25"].setUrl(mapTilesets["GeoFS"])
        }
    }

    benevolanceUi.on("toggle", () => {
        if (!benevolanceUi.isEnabled) {
            remove_styles()
        } else {
            apply_styles()
        }
        restart_mp()
    })

    if (benevolanceUi.isEnabled) {    
        apply_styles()
    } else {
        remove_styles()
    }

    benevolanceUi.on("MapStyle:change", (tileset) => {
        if (benevolanceUi.isEnabled) geofs.api.map._map._layers["25"].setUrl(tileset)
    })

    benevolanceUi.on("RemoveFoos:change", () => {
       if (benevolanceUi.isEnabled) restart_mp()
    })

    var toGo = document.getElementsByClassName('geofs-datasourceSelector');
    while(toGo[0]) {
        toGo[0].parentNode.removeChild(toGo[0]);
    }

    toGo = document.getElementsByClassName('geofs-debug-info')
    while(toGo[0]) {
        toGo[0].parentNode.removeChild(toGo[0]);
    }

    geofs.map.addPlayerMarker = function(e, t, a) {
        if (!ui.playerMarkers[e]) {
            var o = {
                coords: [0, 0],
                icon: geofs.api.map.getIcon(t, geofs.map.icons[t || "blue"]),
                label: a || "-"
            };
            if (benevolanceUi.getBool("RemoveFoos") && benevolanceUi.isEnabled) {
                if (o.label !== "-" && multiplayer.users[e].callsign !== "Foo" && multiplayer.users[e].callsign !== "") {
                    ui.playerMarkers[e] = new geofs.api.map.marker(o)
                }
            } else {
                ui.playerMarkers[e] = new geofs.api.map.marker(o)
            }
        }

        if (benevolanceUi.getBool("RemoveFoos") && benevolanceUi.isEnabled) {
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
