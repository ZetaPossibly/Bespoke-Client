(function() {
    const commonCSS = document.styleSheets[2];

    // Loop through all CSS rules in the sheet
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



    var toGo = document.getElementsByClassName('geofs-datasourceSelector');
    while(toGo[0]) {
        toGo[0].parentNode.removeChild(toGo[0]);
    }

    toGo = document.getElementsByClassName('geofs-debug-info')
    while(toGo[0]) {
        toGo[0].parentNode.removeChild(toGo[0]);
    }


    geofs.api.map._map._fadeAnimated = false
    geofs.api.map._map.options.maxZoom = 19
    geofs.api.map._map._layers["25"]._url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    geofs.api.map._map._layers["25"]._url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    geofs.api.map._map._panes.mapPane.parentElement.style.background = "black"

    let prefix = "benevolance"
    let benevolanceUi = new window.BUIM("Benevolance", prefix)

    mapTilesets = {
        "CartoDB Dark": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        "Default GeoFS": "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        "OSM": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    }

    benevolanceUi.addDropdown("Map Tileset", prefix+"Tileset", mapTilesets)
    document.getElementById(prefix+"Tileset").addEventListener("change", function() {
        let selectedTileset = this.value
        geofs.api.map._map._layers["25"]._url = mapTilesets[selectedTileset]
    })
})();
