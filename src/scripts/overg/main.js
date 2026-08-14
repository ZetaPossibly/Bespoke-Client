(async function () {
    "use strict";

    const overgUi = new window.BUIM("OverG Shaders", "overg");

    // Display Controls
    overgUi
        .addItem("Cockpit Only", "cockpitOnly", "checkbox", true)
        .addItem("Enable G-LOC Hold", "glocEnabled", "checkbox", false)
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
        .addItem("Max Strength Multiplier", "maxStrength", "number", 1.0);

    // Helper to safely parse numbers with fallback
    function safeParseFloat(val, fallback) {
        let n = parseFloat(val);
        return isNaN(n) ? fallback : n;
    }

    function getUpdatedConf() {
        return {
            // Positive G settings
            baseTolerance: safeParseFloat(overgUi.get("gTol"), 5.0),
            gSuitBonus: overgUi.getBool("gSuitEnabled") ? 1.5 : 0,
            agsmBonus: overgUi.getBool("agsmEnabled") ? 3.0 : 0,

            // Negative G settings (humans tolerate far less -G than +G)
            negBaseTolerance: safeParseFloat(overgUi.get("negGTol"), -2.0),
            cockpitOnly: overgUi.getBool("cockpitOnly"),
            glocEnabled: overgUi.getBool("glocEnabled"),

            overEnabled: overgUi.getBool("overEnabled"),
            underEnabled: overgUi.getBool("underEnabled"),

            // --- Realism tuning (aviation-medicine derived, not exposed in UI) ---
            posSaturationRange: 2.5, // G past tolerance needed to go from onset -> full blackout
            negSaturationRange: 1.5, // G past tolerance needed to go from onset -> full redout (vascular engorgement is quicker than +Gz greyout)

            onsetPenaltyPerGs: 0.35, // +Gz tolerance lost per G/s of onset rate ("push-pull effect": rapid onset outruns the baroreceptor reflex)
            onsetPenaltyMax: 2.5, // cap, matches centrifuge studies showing ~2-3G tolerance loss under rapid onset

            blackoutAttackTau: 1.2, // s, greyout/tunnel closing in
            blackoutReleaseTau: 2.5, // s, cerebral reperfusion lag - vision doesn't snap back the instant G drops
            redoutAttackTau: 0.35, // s, ocular vascular engorgement is fast
            redoutReleaseTau: 1.5, // s
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

    function clamp01(x) {
        return Math.max(0, Math.min(1, x));
    }

    // Asymmetric exponential approach: different time constant depending on whether
    // we're building the effect up or letting it recover.
    function approach(current, target, attackTau, releaseTau, dt) {
        const tau = target > current ? attackTau : releaseTau;
        const alpha = 1 - Math.exp(-dt / Math.max(tau, 0.0001));
        return current + (target - current) * alpha;
    }

    let lastG = 1.0; // G at last frame, used to compute onset rate (dG/dt)

    function getGState() {
        let dt = window.gameDeltaTime;
        if (typeof dt !== "number" || isNaN(dt) || dt <= 0) {
            dt = 0.016;
        }
        dt = Math.min(dt, 0.1);

        // Safely retrieve loadFactor (fallback to 1.0G if undefined, null, or NaN during plane spawn/reset)
        let rawG = geofs?.animation?.values?.loadFactor;
        let currentG = typeof rawG === "number" && !isNaN(rawG) ? rawG : 1.0;

        // Clamp extreme physics glitches (e.g. crash/respawn loadFactor spikes)
        currentG = Math.max(-15.0, Math.min(25.0, currentG));

        // G-onset rate (only the +Gz direction is used for the tolerance penalty below -
        // the rapid-onset tolerance-loss effect is specifically documented for +Gz)
        let dG = currentG - lastG;
        let onsetRate = Math.max(0, dG / dt);
        lastG = currentG;

        // Init persistent state on the function itself (survives across calls, self-contained)
        if (
            typeof getGState.blackoutLevel !== "number" ||
            isNaN(getGState.blackoutLevel)
        )
            getGState.blackoutLevel = 0;
        if (
            typeof getGState.redoutLevel !== "number" ||
            isNaN(getGState.redoutLevel)
        )
            getGState.redoutLevel = 0;
        if (
            typeof getGState.glocTimer !== "number" ||
            isNaN(getGState.glocTimer)
        )
            getGState.glocTimer = 0;

        // --- Effective tolerances ---
        const onsetPenalty = Math.min(
            onsetRate * G_CONFIG.onsetPenaltyPerGs,
            G_CONFIG.onsetPenaltyMax,
        );
        const effTolerancePos =
            G_CONFIG.baseTolerance +
            G_CONFIG.gSuitBonus +
            G_CONFIG.agsmBonus -
            onsetPenalty;
        const effToleranceNeg = G_CONFIG.negBaseTolerance; // G-suit and AGSM give ~no protection against -Gz

        // --- G excess past tolerance -> target visual strength ---
        const posExcess = Math.max(0, currentG - effTolerancePos);
        const negExcess = Math.max(0, effToleranceNeg - currentG);

        let targetBlackout = G_CONFIG.overEnabled
            ? clamp01(posExcess / G_CONFIG.posSaturationRange)
            : 0;
        let targetRedout = G_CONFIG.underEnabled
            ? clamp01(negExcess / G_CONFIG.negSaturationRange)
            : 0;

        // G-LOC hold: once fully blacked out, vision stays gone briefly even if G drops right away
        if (getGState.blackoutLevel >= 0.995 && G_CONFIG.glocEnabled) {
            getGState.glocTimer = 20; // seconds
        }
        if (getGState.glocTimer > 0) {
            if (getGState.glocTimer < 10) {
                // for the last 10 seconds of G-LOC, fade back in gradually
                targetBlackout = Math.max(targetBlackout, 0.7);
            } else {
                targetBlackout = 1.0;
            }
            getGState.glocTimer = Math.max(0, getGState.glocTimer - dt);
        }

        getGState.blackoutLevel = approach(
            getGState.blackoutLevel,
            targetBlackout,
            G_CONFIG.blackoutAttackTau,
            G_CONFIG.blackoutReleaseTau,
            dt,
        );
        getGState.redoutLevel = approach(
            getGState.redoutLevel,
            targetRedout,
            G_CONFIG.redoutAttackTau,
            G_CONFIG.redoutReleaseTau,
            dt,
        );

        const uiActive =
            overgUi.isEnabled &&
            (!G_CONFIG.cockpitOnly ||
                geofs?.animation?.values?.view === "cockpit");

        let outBlackout = uiActive ? getGState.blackoutLevel : 0;
        let outRedout = uiActive ? getGState.redoutLevel : 0;

        // Final NaN guard before hitting WebGL uniforms
        if (typeof outBlackout !== "number" || isNaN(outBlackout))
            outBlackout = 0;
        if (typeof outRedout !== "number" || isNaN(outRedout)) outRedout = 0;

        return {
            blackout: outBlackout,
            redout: outRedout,
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
