uniform sampler2D colorTexture;
varying vec2 v_textureCoordinates;

uniform float blackoutStrength; // (0.0 to 1.0) 0 is no visual effect, 1 is complete blackout
uniform float redoutStrength;   // (0.0 to 1.0) 0 is no visual effect, 1 is complete redout

// --- Tuning constants (grounded in G-LOC physiology) ---
const vec3  REDOUT_TINT       = vec3(0.55, 0.02, 0.03); // pooled blood tint, not pure red
const float GREYOUT_FRACTION  = 0.35;  // fraction of blackoutStrength spent on peripheral desaturation
                                        // before tunnel vision starts closing (grey-out precedes tunnel/blackout)
const float VIGNETTE_SOFTNESS = 0.7;  // feather width of the closing tunnel edge
const float MAX_VIGNETTE_R    = 1;  // radius (screen-space, aspect corrected) where closure begins
const float REDOUT_DARKEN_AT  = 0.8;   // extreme -Gz also causes vision loss, just red-tinted first

float luma(vec3 c) {
    return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
    vec2 uv = v_textureCoordinates;
    vec4 srcColor = texture2D(colorTexture, uv);
    vec3 color = srcColor.rgb;

    // Aspect-corrected distance from screen center, so the vignette is circular not elliptical
    vec2 aspect = vec2(czm_viewport.z / czm_viewport.w, 1.0);
    vec2 centered = (uv - 0.5) * aspect;
    float dist = length(centered);

    // ---------- BLACKOUT (+Gz: blood drains from head/eyes) ----------
    // Real progression: peripheral colour loss (grey-out) -> tunnel vision -> total blackout,
    // consciousness can briefly persist through blackout before G-LOC.
    float bo = clamp(blackoutStrength, 0.0, 1.0);

    float greyAmount = clamp(bo / GREYOUT_FRACTION, 0.0, 1.0);
    vec3 desatColor = mix(color, vec3(luma(color)), greyAmount);

    float closureT = clamp((bo - GREYOUT_FRACTION) / (1.0 - GREYOUT_FRACTION), 0.0, 1.0);
    // edge sweeps from MAX_VIGNETTE_R down past 0 (negative) so center goes fully black at bo = 1
    float edge = mix(MAX_VIGNETTE_R, -VIGNETTE_SOFTNESS, closureT);
    float vigMask = 1.0 - smoothstep(edge - VIGNETTE_SOFTNESS, edge, dist);

    vec3 blackoutColor = desatColor * vigMask;

    // ---------- REDOUT (-Gz: blood pools toward head/eyes) ----------
    // Faster onset, little warning, whole field reddens rather than tunneling.
    float ro = clamp(redoutStrength, 0.0, 1.0);

    vec3 redoutColor = mix(color, REDOUT_TINT, ro * 0.85);
    float extremeDarken = mix(1.0, 0.15, smoothstep(REDOUT_DARKEN_AT, 1.0, ro));
    redoutColor *= extremeDarken;

    // ---------- Combine ----------
    // Additive delta-combine: each effect is already identity at strength 0,
    // so this degrades gracefully even if both are nonzero (nonphysical, but shader stays stable).
    vec3 delta = (blackoutColor - color) + (redoutColor - color);
    vec3 finalColor = clamp(color + delta, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, srcColor.a);
}