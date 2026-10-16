
(function () {
    let vals = {
        _words: 0,
        wpm: 0,
        missiles: 0,
        _startTime: 1,
        time: 1,
        rate: 0,
        _customDuration: 0
    }

    const spamColors = {
        "Green": "#00ff00",
        "Blue": "#0000ff",
        "Red": "#ff0000",
        "Purple": "#6f00ff",
        "Orange": "#ff7f00",
        "Yellow": "#ffff00",
        "Cyan": "#00ffff"
    }

    const spamUi = new window.BUIM("Private Spam", "spam");

    spamUi
        .addSubHeading("Send 'Start spam 10' in chat to start a 10second spam set. And 'Stop spam' to stop the current set.")
        .addItem("Default Set Duration(seconds)", "duration", "number", 30)
        .addItem("Show Notice", "notice", "checkbox", true)
        .addDropdown("Spam Color", "color", spamColors, spamColors["Purple"])

    let spamming = false

    let startSpam = function (duration) {
        spamming = true
        vals._words = 0
        vals.wpm = 0
        vals.missiles = 0
        vals._startTime = 1
        vals.time = 1
        vals.rate = 0
        if (spamUi.getBool("notice")) alert("Spam Mode Enabled, Time will begin counting when you send your first message. You can disable this message in the settings. Your messages sent will no longer be sent over Multiplayer and are not visible to others. You can always stop the current set by clicking the Stop Current Set button. View your stats in the HUD panel.");
        ui.chat.$container.prepend('<div class="geofs-chat-message" style="color: ' + spamColors[spamUi.get("color")] + '; text-align: center;"> <b class="label">--SPAM STARTED FOR ' + duration + ' SECONDS --</b> (configure default in settings)</div>')
    }

    let stopSpam = function () {
        spamming = false
        vals.time = 0
        ui.chat.$container.prepend('<div class="geofs-chat-message" style="color: ' + spamColors[spamUi.get("color")] + '; text-align: center;"> <b class="label">--END SPAM--</b></div>')
    }

    const panelInstance = window.createHudPanel({
        fields: {
            spm: "SPAM",
            wpm: "WPM",
            missles: "MSL",
            time: "TIME",
            rate: "RATE"
        },
        interval: 100,
        onUpdate: (fields) => {
            if (!spamming) {
                fields.spm.setValue("OFF");
                fields.spm.setColor("red");
                return
            } else if (vals._startTime === 1) { // if waiting for first message
                fields.spm.setValue("GO!");
                fields.spm.setColor("green");
                vals.time = 0
            } else {
                vals.time = Math.round((Date.now() - vals._startTime) / 1000)
                fields.spm.setValue(`ON`)
                fields.spm.setColor("white");
            }
    
            vals.wpm = (vals._words / ((Date.now() - vals._startTime) / 1000)) * 60
            vals.rate = (vals.missiles / ((Date.now() - vals._startTime) / 1000)) * 60
            
            fields.wpm.setValue(`${Math.round(vals.wpm)}`);
            fields.missles.setValue(`${Math.round(vals.missiles)}`);
            
            fields.time.setValue(`${Math.round(vals.time)}/${parseInt(spamUi.get("duration"))}s`);
            fields.rate.setValue(`${Math.round(vals.rate)}/min`);
            
            if (vals.time >= (vals._customDuration || parseInt(spamUi.get("duration")))) {
                vals._customDuration = 0
                spamming = false;
                vals.time = 0;
                ui.chat.$container.prepend('<div class="geofs-chat-message" style="color: ' + spamColors[spamUi.get("color")] + '; text-align: center;"> <b class="label">--END SPAM--</b></div>')
            }
        },
        cssText: "bottom: 50px; left: 10px;"
    });

    if (!spamUi.isEnabled) panelInstance.destroy(); else panelInstance.create();

    spamUi.on("toggle", () => {
        if (!spamUi.isEnabled) {
            panelInstance.destroy();
            spamming = false;
        } else panelInstance.create();
    });

    const originalSetChatMessage = multiplayer.setChatMessage;

    multiplayer.setChatMessage = function (e) {
        if (!spamming) {
            if (e.toLowerCase().startsWith("start spam")) {
                const duration = parseInt(e.split(" ")[2]) || parseInt(spamUi.get("duration"));
                vals._startTime = 1
                vals._customDuration = duration
                startSpam(duration);
                return
            }
            if (typeof originalSetChatMessage === "function") {
                return originalSetChatMessage.apply(this, arguments);
            } else {
                multiplayer.chatMessage = e
                return
            }
        }

        if (e.toLowerCase().startsWith("stop spam")) {
            stopSpam();
        }

        if (vals._startTime === 1) {
            vals._startTime = Date.now()
        }

        vals._words += e.trim().split(/\s+/).filter(Boolean).length
        if (e.toLowerCase().includes("lock")) {
            vals.missiles++
        }

        ui.chat.$container.prepend('<div class="geofs-chat-message" style="color: ' + spamColors[spamUi.get("color")] + '; text-align: right;">  <i>' + e + '<b class="label"> -SPAM</b></i>  </div>')
    }
})()