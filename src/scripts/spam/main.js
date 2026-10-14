
(function () {
    let vals = {
        _words: 0,
        wpm: 0,
        missiles: 0,
        _startTime: 1,
        time: 1,
        rate: 0
    }

    const spamUi = new window.BUIM("Private Spam", "spam");

    spamUi
        .addItem("Set Duration(seconds)", "duration", "number", 45)
        .addButton("Start New Set", "start", () => {
            
            spamming = true
            vals._words = 0
            vals.wpm = 0
            vals.missiles = 0
            vals._startTime = 1
            vals.time = 1
            vals.rate = 0
        })
        .addItem("Show Notice", "notice", "checkbox", true)
        .addButton("Stop Current Set", () => {
            spamming = false
            if (spamUi.getValue("notice")) alert("Spam Mode Enabled, Time will begin counting when you send your first message. You can disable this message in the settings. Your messages sent will no longer be sent over Multiplayer and are not visible to others. You can always stop the current set by clicking the Stop Current Set button. View your stats in the HUD panel.")
        })

    let spamming = spamUi.isEnabled

    const panelInstance = window.createHudPanel({
        fields: {
            spm: "SPM",
            wpm: "WPM",
            missles: "MSLs",
            time: "TIME",
            rate: "RATE"
        },
        interval: 100,
        onUpdate: (fields) => {
            if (!spamming) {
                fields.spm.setValue("FALSE");
                fields.wpm.setColor("red");
                return
            };
            vals.time = Math.round((Date.now() - multiplayer._startTime) / 1000);
            fields.wpm.setValue(`${Math.round(vals.wpm)}`);
            fields.missles.setValue(`${Math.round(vals.missiles)}`);
            fields.time.setValue(`${Math.round(vals.time)}/${spamUi.getValue("duration")}s`);
            fields.rate.setValue(`${Math.round(vals.rate)}/min`);
            fields.spm.setValue(`TRUE`);
            fields.wpm.setColor("white");
            if (vals.time >= spamUi.getValue("duration")) {
                spamming = false;
                ui.chat.$container.prepend('<div class="geofs-chat-message" style="color: #6f00ff; text-align: right;"> <b class="label"> END SPAM</b></div>')
            }
        },
        cssText: "bottom: 90px; left: 10px;"
    });

    if (!spamUi.isEnabled) panelInstance.destroy();

    spamUi.on("toggle", () => {
        if (!spamUi.isEnabled) {
            panelInstance.destroy();
            spamming = false;
        } else panelInstance.create();
    });

    const originalSetChatMessage = multiplayer.setChatMessage;

    multiplayer.setChatMessage = function (e) {
        if (!spamming) {
            if (typeof originalSetChatMessage === "function") {
                return originalSetChatMessage.apply(this, arguments);
            } else {
                multiplayer.chatMessage = e
                return
            }
        }

        if (vals._startTime === 1) {
            vals._startTime = Date.now()
        }

        vals._words += e.trim().split(/\s+/).filter(Boolean).length
        vals.wpm = (vals._words / ((Date.now() - vals._startTime) / 1000)) * 60
        if (e.toLowerCase().includes("lock")) {
            vals.missiles++
        }
        vals.rate = (vals.missiles / ((Date.now() - vals._startTime) / 1000)) * 60

        ui.chat.$container.prepend('<div class="geofs-chat-message" style="color: #6f00ff; text-align: right;">  <i>' + e + '<b class="label"> -SPAM</b></i>  </div>')
    }
})()