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
        .addSubHeading("Assistive Gear (enable for fighter-jet flight")
        .addItem("Wear G-Suit (+1.5G Tol)", "gSuitEnabled", "checkbox", true)
        .addItem(
            "Anti-G Straining Maneuver Trained (+1.0G Tol)",
            "agsmEnabled",
            "checkbox",
            true,
        )
        .addItem(
            "Max shader strength multiplier",
            "maxStrength",
            "number",
            1.0,
        );

    function getUpdatedConf() {
        return {
            // Positive G Settings
            baseTolerance: overgUi.get("gTol") || 5.0,
            gSuitBonus: overgUi.getBool("gSuitEnabled") ? 1.5 : 0,
            agsmBonus: overgUi.getBool("agsmEnabled") ? 3.0 : 0,
            onsetSensitivity: 0.1,
            o2ReserveTime: 5.0,
            recoveryRate: 0.1,

            // Negative G Settings (Humans tolerate much less -G)
            negBaseTolerance: overgUi.get("negGTol") || -2.0,
            negRedoutTime: 3.0, // Seconds until full redout at limit
            negFlushMultiplier: 0.7, // Accelerated blackout clearance during negative G transition

            cockpitOnly: overgUi.getBool("cockpitOnly"),
            maxStrength: overgUi.get("maxStrength") || 1.0,
            overEnabled: overgUi.getBool("overEnabled"),
            underEnabled: overgUi.getBool("underEnabled"),
        }
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

    let o2Reserve = 1.0; // Positive G vision tracker (1 = clear, 0 = blackout)
    let redoutLevel = 0.0; // Negative G vision tracker (0 = clear, 1 = total redout)
    let lastG = 1.0;

    function getGState() {
        let dt = window.gameDeltaTime || 0.016; // Default to 60fps if gameDeltaTime is not available or is 0 (prevent division by zero)

        if ((G_CONFIG.cockpitOnly && geofs.animation.values.view !== "cockpit") || !overgUi.isEnabled) {
            o2Reserve = Math.min(1.0, o2Reserve + dt * G_CONFIG.recoveryRate);
            redoutLevel = Math.max(0.0, redoutLevel - dt * 0.5);
            return { blackout: 0, redout: 0 };
        }

        let currentG = geofs.animation.values.loadFactor || 1.0;

        // G-onset rate
        let dG = currentG - lastG;
        let onsetRate = Math.max(0, dG / dt);
        lastG = currentG;

        let blackoutLevel = 0
        let redoutLevelFinal = 0

        if (G_CONFIG.overEnabled) {
            let onsetPenalty = Math.min(1.5, onsetRate * G_CONFIG.onsetSensitivity);
            let posEffectiveLimit =
                G_CONFIG.baseTolerance +
                G_CONFIG.gSuitBonus +
                G_CONFIG.agsmBonus -
                onsetPenalty;

            if (currentG > posEffectiveLimit) {
                // Oxygen reserve depletes
                let excessG = currentG - posEffectiveLimit;
                let drainRate = excessG / 3.0 / G_CONFIG.o2ReserveTime;
                o2Reserve = Math.max(0.0, o2Reserve - drainRate * dt);
            } else if (currentG < 0.0) {
                let flushSpeed =
                    G_CONFIG.recoveryRate *
                    G_CONFIG.negFlushMultiplier *
                    Math.abs(currentG);
                o2Reserve = Math.min(1.0, o2Reserve + flushSpeed * dt);
            } else {
                // oxygenation
                let margin = Math.max(
                    0,
                    (posEffectiveLimit - currentG) / posEffectiveLimit,
                );
                let recoveryFactor = G_CONFIG.recoveryRate * (0.5 + 0.5 * margin);
                o2Reserve = Math.min(1.0, o2Reserve + recoveryFactor * dt);
            }
            blackoutLevel = (1.0 - o2Reserve) * G_CONFIG.maxStrength;
        }

        if (G_CONFIG.underEnabled) {
            if (currentG < G_CONFIG.negBaseTolerance) {
                // Exceeding negative G limit
                let excessNegG = Math.abs(currentG - G_CONFIG.negBaseTolerance);
                let redoutRate = excessNegG / 2.0 / G_CONFIG.negRedoutTime;
                redoutLevel = Math.min(1.0, redoutLevel + redoutRate * dt);
            } else {
                // Rapid dissipation of redout when blood pressure in head returns to normal
                redoutLevel = Math.max(0.0, redoutLevel - dt * 0.6);
            }
            redoutLevelFinal = redoutLevel * G_CONFIG.maxStrength;
        }

        return {
            blackout: blackoutLevel,
            redout: redoutLevelFinal,
        };
    }

    geofs.fx.overg = {
        create: function () {
            geofs.fx.overg.shader = new Cesium.PostProcessStage({
                fragmentShader: geofs["overgOverlay.glsl"],
                uniforms: {
                    blackoutStrength: 0.0,
                    redoutStrength: 0.0,
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
