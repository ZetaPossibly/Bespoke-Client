(async function () {
    "use strict";

    const overgUi = new window.BUIM("OverG Shaders", "overg");

    // Display Controls
    overgUi
        .addItem("Cockpit Only", "cockpitOnly", "checkbox", true)
        .addItem("OverG Enabled", "overEnabled", "checkbox", true)
        .addItem("UnderG Enabled", "underEnabled", "checkbox", true)
        .addItem("Base G Tolerance", "gTol", "number", 5)
        .addItem("Base Neg-G Tolerance", "negGTol", "number", -2)
        .addItem("Recover Rate", "recoveryRate", "number", 0.5)
        .addSubHeading("Assistive Techniques (enable for fighter-jet flight")
        .addItem("Wear G-Suit (+1.5G Tol)", "gSuitEnabled", "checkbox", true)
        .addItem(
            "Anti-G Straining Maneuver Trained (+3.0G Tol)",
            "agsmEnabled",
            "checkbox",
            true,
        )
        .addItem(
            "Max Strength Multiplier",
            "maxStrength",
            "number",
            1.0,
        );

    // Helper to safely parse numbers with fallback
    function safeParseFloat(val, fallback) {
        let n = parseFloat(val);
        return isNaN(n) ? fallback : n;
    }

    function getUpdatedConf() {
        return {
            // Positive G Settings
            baseTolerance: safeParseFloat(overgUi.get("gTol"), 5.0),
            gSuitBonus: overgUi.getBool("gSuitEnabled") ? 1.5 : 0,
            agsmBonus: overgUi.getBool("agsmEnabled") ? 3.0 : 0,
            onsetSensitivity: 0.1,
            blackoutReserveTime: 5.0,
            recoveryRate: safeParseFloat(overgUi.get("recoveryRate"), 0.5),

            // Negative G Settings (Humans tolerate much less -G)
            negBaseTolerance: safeParseFloat(overgUi.get("negGTol"), -2.0),
            negRedoutTime: 3.0, // Seconds until full redout at limit
            negFlushMultiplier: 0.7, // Accelerated blackout clearance during negative G transition

            cockpitOnly: overgUi.getBool("cockpitOnly"),
            maxStrength: safeParseFloat(overgUi.get("maxStrength"), 1.0),
            overEnabled: overgUi.getBool("overEnabled"),
            underEnabled: overgUi.getBool("underEnabled"),
        };
    }

    let G_CONFIG = getUpdatedConf();

    setInterval(() => {
        G_CONFIG = getUpdatedConf();
    }, 1000);

    // fetch shader
    const shaderURL = getUrl("scripts/overg/overlay.glsl");
    const response = await fetch(shaderURL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    geofs["overgOverlay.glsl"] = await response.text();

    let blackoutReserve = 1.0; // Positive G vision tracker (1 = clear, 0 = blackout)
    let redoutLevel = 0.0; // Negative G vision tracker (0 = clear, 1 = total redout)
    let lastG = 1.0;

    function getGState() {
        // Safe delta time calculation (cap at max 100ms to prevent alt-tab / lag spikes from breaking state)
        let dt = window.gameDeltaTime;
        if (typeof dt !== "number" || isNaN(dt) || dt <= 0) {
            dt = 0.016;
        }
        dt = Math.min(dt, 0.1);

        // Safely retrieve loadFactor (fallback to 1.0G if undefined, null, or NaN during plane spawn/reset)
        let rawG = geofs?.animation?.values?.loadFactor;
        let currentG = (typeof rawG === "number" && !isNaN(rawG)) ? rawG : 1.0;

        // Clamp extreme physics glitches (e.g. crash/respawn loadFactor spikes)
        currentG = Math.max(-15.0, Math.min(25.0, currentG));

        // G-onset rate
        let dG = currentG - lastG;
        let onsetRate = Math.max(0, dG / dt);
        lastG = currentG;

        // View or UI disable check
        if (
            (G_CONFIG.cockpitOnly && geofs?.animation?.values?.view !== "cockpit") ||
            !overgUi.isEnabled
        ) {
            blackoutReserve = Math.min(
                1.0,
                blackoutReserve + dt * G_CONFIG.recoveryRate,
            );
            redoutLevel = Math.max(0.0, redoutLevel - dt * 0.5);

            // Sanitize values
            if (isNaN(blackoutReserve)) blackoutReserve = 1.0;
            if (isNaN(redoutLevel)) redoutLevel = 0.0;

            return { blackout: 0, redout: 0 };
        }

        let blackoutLevel = 0;
        let redoutLevelFinal = 0;

        if (G_CONFIG.overEnabled) {
            let onsetPenalty = Math.min(
                1.5,
                onsetRate * G_CONFIG.onsetSensitivity,
            );
            
            // Prevent posEffectiveLimit from reaching zero or negative to avoid division by zero
            let posEffectiveLimit = Math.max(
                0.5,
                G_CONFIG.baseTolerance +
                G_CONFIG.gSuitBonus +
                G_CONFIG.agsmBonus -
                onsetPenalty
            );

            let reserveTime = Math.max(0.1, G_CONFIG.blackoutReserveTime);

            if (currentG > posEffectiveLimit) {
                // Oxygen reserve depletes
                let excessG = currentG - posEffectiveLimit;
                let drainRate = excessG / 3.0 / reserveTime;
                blackoutReserve = Math.max(
                    0.0,
                    blackoutReserve - drainRate * dt,
                );
            } else if (currentG < 0.0) {
                let flushSpeed =
                    G_CONFIG.recoveryRate *
                    G_CONFIG.negFlushMultiplier *
                    Math.abs(currentG);
                blackoutReserve = Math.min(
                    1.0,
                    blackoutReserve + flushSpeed * dt,
                );
            } else {
                // Oxygenation
                let margin = Math.max(
                    0,
                    (posEffectiveLimit - currentG) / posEffectiveLimit,
                );
                let recoveryFactor =
                    G_CONFIG.recoveryRate * (0.5 + 0.5 * margin);
                blackoutReserve = Math.min(
                    1.0,
                    blackoutReserve + recoveryFactor * dt,
                );
            }
            blackoutLevel = (1.0 - blackoutReserve) * G_CONFIG.maxStrength;
        } else {
            blackoutReserve = Math.min(1.0, blackoutReserve + dt * G_CONFIG.recoveryRate);
        }

        if (G_CONFIG.underEnabled) {
            let redoutTime = Math.max(0.1, G_CONFIG.negRedoutTime);
            if (currentG < G_CONFIG.negBaseTolerance) {
                // Exceeding negative G limit
                let excessNegG = Math.abs(currentG - G_CONFIG.negBaseTolerance);
                let redoutRate = excessNegG / 2.0 / redoutTime;
                redoutLevel = Math.min(1.0, redoutLevel + redoutRate * dt);
            } else {
                // Rapid dissipation of redout when blood pressure in head returns to normal
                redoutLevel = Math.max(0.0, redoutLevel - dt * 0.6);
            }
            redoutLevelFinal = redoutLevel * G_CONFIG.maxStrength;
        } else {
            redoutLevel = Math.max(0.0, redoutLevel - dt * 0.6);
        }

        // Hard recovery protection against NaN propagating to WebGL uniforms
        if (isNaN(blackoutReserve)) blackoutReserve = 1.0;
        if (isNaN(redoutLevel)) redoutLevel = 0.0;
        if (isNaN(blackoutLevel)) blackoutLevel = 0.0;
        if (isNaN(redoutLevelFinal)) redoutLevelFinal = 0.0;

        return {
            blackout: Math.max(0.0, Math.min(1.0, blackoutLevel)),
            redout: Math.max(0.0, Math.min(1.0, redoutLevelFinal)),
        };
    }

    geofs.fx.overg = {
        create: function () {
            geofs.fx.overg.shader = new Cesium.PostProcessStage({
                fragmentShader: geofs["overgOverlay.glsl"],
                uniforms: {
                    blackoutStrength: 0.0,
                    redoutStrength: 0.0,
                    u_time: function() {
                        return performance.now() / 1000.0; // Pass time in seconds
                    }
                },
            });
            geofs.api.viewer.scene.postProcessStages.add(geofs.fx.overg.shader);
        },
        update: function () {
            let state = getGState();
            geofs.fx.overg.shader.uniforms.blackoutStrength = state.blackout;
            geofs.fx.overg.shader.uniforms.redoutStrength = state.redout;
        },
    };

    geofs.fx.overg.create();

    geofs.api.viewer.scene.preRender.addEventListener(() => {
        geofs.fx.overg.update();
    });
})();