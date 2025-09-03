let aircraft_codes = new Map();
fetch("https://www.geo-fs.com/geofs.php")
  .then((res) => res.text())
  .then((data) => {
    let aircraftRegex =
      /geofs\.aircraftList\['([^']*)'\]\s*=\s*{\s*name:\s*'([^'(]*)[^']*',/g;
    let match;
    while ((match = aircraftRegex.exec(data)) !== null) {
      aircraft_codes.set(match[1], match[2].trim());
    }
    console.log(aircraft_codes);
    wt_init();
  });
function wt_init() {
  multiplayer.update = function (e) {
    try {
      for (var t in (multiplayer.lastResponse &&
        (multiplayer.updateUsers(multiplayer.lastResponse.users),
        (multiplayer.lastResponse = null)),
      multiplayer.nextUpdateTime &&
        Date.now() > multiplayer.nextUpdateTime &&
        multiplayer.sendUpdate(),
      multiplayer.visibleUsers)) {
        var a,
          o = multiplayer.visibleUsers[t];
        o.currentServerTime = multiplayer.getServerTime();
        if (!(o.callsign === "Foo" || o.callsign === "")) {
          o.model
            ? ((o.elapsedTime = o.elapsedTime + e),
              ((a = M3.add(
                o.referenceCoord,
                M3.scale(o.correctedVelocity, o.elapsedTime)
              ))[3] = fixAngle(a[3])),
              (a[4] = fixAngle(a[4])),
              (a[5] = fixAngle(a[5])),
              (o.currentInterpolatedCoord = a),
              (o.referencePoint.lla = o.currentInterpolatedCoord),
              o.model.setPositionOrientationAndScale(
                [a[0], a[1], a[2]],
                [a[3], a[4], a[5]]
              ))
            : (a = o.lastUpdate.co);

          var n = [a[0], a[1], a[2]];
          var to_add = "";
          if (o.distance < 50000) {
            to_add = "\n" + aircraft_codes.get(o.aircraft.toString()) + " \n \n " + (o.distance / 1000).toFixed(2) + " km";
          }

          o.label.text = o.callsign + to_add;

          geofs.api.setLabelPosition(o.label, n);
          o.icon && o.icon.setLocation(n);
        }
      }
    } catch (r) {
      geofs.debug.error(r, "multiplayer.update");
    }
  };

  geofs.api.setLabelPosition = function(e, t) {
        if (e) {
            if (!V3.isValid(t)) {
                geofs.api.removeLabel(e)
                console.log(e)
                geofs.debug.debugger();
                return
            }
            e.position = new Cesium.Cartesian3.fromDegrees(t[1],t[0],t[2])
            e.pixelOffset.y = 22
            return
        }
    }

  multiplayer.User.prototype.addCallsign = function (e, t) {
    if (!(e == "Foo" || e == "") && localStorage.getItem("wtLabelsEnabled") === "true") {
      if (
        ((this.label = geofs.api.addLabel(
          e,
          null,
          multiplayer.labelOptions[t]
        )),
        multiplayer.iconOptions[t])
      ) {
        var a = Object.assign({}, multiplayer.iconOptions[t], {
          pixelOffset: new Cesium.Cartesian2(-(4 * e.length + 5), 0),
        });
        this.icon = new geofs.api.billboard(null, null, a);
      }
    } 
  };

  const colourConfig = {
    font: "12pt Trebuchet MS",
    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    eyeOffset: new Cesium.Cartesian3(0, 0, 0),
    fillColor: Cesium.Color.fromCssColorString("#ab3b35ff"),
    outlineColor: (localStorage.getItem("wtLabelsOutline" === "true")) ? Cesium.Color.BLACK : Cesium.Color.TRANSPARENT,
    outlineWidth: 1,
    disableDepthTestDistance: 50000
  };
  multiplayer.labelOptions.default = colourConfig;
  multiplayer.labelOptions.premium = colourConfig;

  multiplayer.stop();
  multiplayer.start();

  const wtUi = new window.BUIM("War Thunder Styled Labels", "wtLabels");
  wtUi.add_item("Enable Outline", "outline", "checkbox", 1, "onchange='multiplayer.stop(); multiplayer.start()'") //   addItem(description, lsName, type, level, defaultValue, options) 
}
