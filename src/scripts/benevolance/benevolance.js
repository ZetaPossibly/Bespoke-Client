(function () {
  let mapTilesets = {
    "CartoDB Dark": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png?key=cb1_25qo_1_eb7846a120e7b449cea89184", // using this key outside this project is fraudulant and a crime in most places
    Google: "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    "GeoFS 3.9": "https://data.geo-fs.com/osm/{z}/{x}/{y}.png",
    "GeoFS 4.0": "https://data.geo-fs.com/osm25/{z}/{x}/{y}.png",
    "ESRI Satellite": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    "Earth at night":
      "https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/2012-01-01/GoogleMapsCompatible_Level{z}/{z}/{y}/{x}.jpg",
    OSM: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  };
  function apply_styles() {
    geofs.preferences.interface.transparent = true;
    ui.applyPreferences();
    const style = document.createElement("style");
    style.id = "BespokeTheme";
    style.textContent = `
            .geofs-transparentUI .geofs-map-viewport {
                -webkit-mask-image: linear-gradient(90deg, #ffffffe0 100%, #ffffff00 100%);
                backdrop-filter: blur(10px);
            }
            
            .geofs-transparentUI .geofs-ui-bottom {
                background-color: #0000005e;
                backdrop-filter: blur(5px);
            }

            /* Livery Selector */ 
            #favorites li.livery-list-item, #airlinelist li.livery-list-item, #liverylist li.livery-list-item {
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

            .geofs-transparentUI {
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

            .geofs-transparentUI .geofs-ui-bottom .mdl-button {
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
            .leaflet-popup-content-wrapper, .leaflet-popup-tip {
                background-color: #000000ca !important;
                box-shadow: none
            }

            .geofs-map-popup > button {
                color: white !important
            }
            
            .mdl-chip {
                background-color: #000000ca;
                color: white;
            }
            .mdl-menu {
                color: white
            }

            .geofs-onlyForSR {
                background: none !important;
            }

            .geofs-preferences .geofs-debug-info {
                background: none;
            }
        `;

    document.head.appendChild(style);

    geofs.api.map._map.options.maxZoom = 19;
    geofs.api.map._map._panes.mapPane.parentElement.style.background = "black";
    let curStyle = benevolanceUi.get("MapStyle")
    if (!Object.values(mapTilesets).includes(curStyle)) {
        curStyle = null
    }
    change_map_tileset(curStyle || mapTilesets["CartoDB Dark"]);
  }

  function remove_styles() {
    geofs.api.map._map.options.maxZoom = 13;
    geofs.api.map._map._panes.mapPane.parentElement.style.background = "";
    document.getElementById("BespokeTheme")?.remove();
    geofs.version === "3.9" ? change_map_tileset(mapTilesets["GeoFS 3.9"]) : change_map_tileset(mapTilesets["GeoFS 4.0"]);
  }

  let prefix = "benevolance";
  let benevolanceUi = new window.BUIM("Benevolance", prefix);
  benevolanceUi
    .addSubHeading("Dark theme automatically enabled 'Transparent UI'. Using without it, is not supported. ")
    .addDropdown("Map Style", "MapStyle", mapTilesets, mapTilesets["GeoFS"])
    .addItem("Remove Foos", "RemoveFoos", "checkbox", true);

  let restart_mp = function () {
    multiplayer.stop();
    setTimeout(() => {
      multiplayer.start();
    }, 500);
  };

  let change_map_tileset = function (url) {
    if (benevolanceUi.isEnabled) {
      geofs.api.map._map._layers["25"].setUrl(url);
    } else {
      geofs.api.map._map._layers["25"].setUrl(mapTilesets["GeoFS"]);
    }
  };

  benevolanceUi.on("toggle", () => {
    if (!benevolanceUi.isEnabled) {
      remove_styles();
    } else {
      apply_styles();
    }
    restart_mp();
  });

  if (benevolanceUi.isEnabled) {
    apply_styles();
  } else {
    remove_styles();
  }

  benevolanceUi.on("MapStyle:change", (tileset) => {
    if (benevolanceUi.isEnabled) geofs.api.map._map._layers["25"].setUrl(tileset);
  });

  benevolanceUi.on("RemoveFoos:change", () => {
    if (benevolanceUi.isEnabled) restart_mp();
  });

  $(document).on("click", ".geofs-closeHaring", function (e) {
    e.stopImmediatePropagation();

    $(this).parents(".geofs-haring").remove();
  });

  geofs.map.addPlayerMarker = function (e, t, a) {
    if (!ui.playerMarkers[e]) {
      var o = {
        coords: [0, 0],
        icon: geofs.api.map.getIcon(t, geofs.map.icons[t || "blue"]),
        label: a || "-",
      };
      if (benevolanceUi.getBool("RemoveFoos") && benevolanceUi.isEnabled) {
        if (o.label !== "-" && multiplayer.users[e].callsign !== "Foo" && multiplayer.users[e].callsign !== "") {
          ui.playerMarkers[e] = new geofs.api.map.marker(o);
        }
      } else {
        ui.playerMarkers[e] = new geofs.api.map.marker(o);
      }
    }

    if (benevolanceUi.getBool("RemoveFoos") && benevolanceUi.isEnabled) {
      if (o.label !== "-" && multiplayer.users[e].callsign !== "Foo" && multiplayer.users[e].callsign !== "") {
        return (geofs.api.map._map && this.mapActive && ui.playerMarkers[e].addToMap(), ui.playerMarkers[e]);
      }
    } else {
      return (geofs.api.map._map && this.mapActive && ui.playerMarkers[e].addToMap(), ui.playerMarkers[e]);
    }
  };

  multiplayer.User.prototype.addCallsign = function (e, t) {
    if (benevolanceUi.getBool("RemoveFoos") && benevolanceUi.isEnabled) {
      if (e == "Foo" || e == "") {
        return;
      }
    }
    if (((this.label = geofs.api.addLabel(e, null, multiplayer.labelOptions[t])), multiplayer.iconOptions[t])) {
      var a = Object.assign({}, multiplayer.iconOptions[t], {
        pixelOffset: new Cesium.Cartesian2(-(4 * e.length + 5), 2),
      });
      this.icon = new geofs.api.billboard(null, null, a);
    }
  };
  multiplayer.update = function (e) {
    try {
      for (var t in (multiplayer.lastResponse &&
        (multiplayer.updateUsers(multiplayer.lastResponse.users), (multiplayer.lastResponse = null)),
      multiplayer.nextUpdateTime && Date.now() > multiplayer.nextUpdateTime && multiplayer.sendUpdate(),
      multiplayer.visibleUsers)) {
        var a,
          o = multiplayer.visibleUsers[t];

        if (benevolanceUi.getBool("RemoveFoos") && benevolanceUi.isEnabled && (o.callsign === "" || o.callsign === "Foo")) {
          o.model && o.model.setVisibility && o.model.setVisibility(false);
          o.label && (o.label.style.display = "none");
          o.icon && o.icon.setVisibility && o.icon.setVisibility(false);
          continue;
        }

        o.model && o.model.setVisibility && o.model.setVisibility(true);
        o.label && (o.label.style.display = "");
        o.icon && o.icon.setVisibility && o.icon.setVisibility(true);

        ((o.currentServerTime = multiplayer.getServerTime()),
          o.model
            ? ((o.elapsedTime = o.elapsedTime + e),
              ((a = M3.add(o.referenceCoord, M3.scale(o.correctedVelocity, o.elapsedTime)))[3] = fixAngle(a[3])),
              (a[4] = fixAngle(a[4])),
              (a[5] = fixAngle(a[5])),
              (o.currentInterpolatedCoord = a),
              (o.referencePoint.lla = o.currentInterpolatedCoord),
              o.model.setPositionOrientationAndScale([a[0], a[1], a[2]], [a[3], a[4], a[5]]))
            : (a = o.lastUpdate.co));
        var n = [a[0], a[1], a[2]];
        (geofs.api.setLabelPosition(o.label, n), o.icon && o.icon.setLocation(n));
      }
    } catch (r) {
      geofs.debug.error(r, "multiplayer.update");
    }
  };
})();
