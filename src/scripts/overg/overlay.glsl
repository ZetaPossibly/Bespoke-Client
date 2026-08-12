uniform sampler2D colorTexture;
varying vec2 v_textureCoordinates;

uniform float blackoutStrength; // +Gz force (0.0 to 1.0)
uniform float redoutStrength;   // -Gz force (0.0 to 1.0)
uniform float u_time;           // Time in seconds (e.g. performance.now() / 1000.0)

// Pseudo-random hash for retinal oxygen starvation noise (phosphenes)
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Rec.709 Luminance
float getLuminance(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// Aspect ratio-corrected UV distance from center
float getAspectDistance(vec2 uv) {
    vec2 aspectUV = (uv - vec2(0.5)) * vec2(czm_viewport.z / czm_viewport.w, 1.0);
    return length(aspectUV);
}

// Radial chromatic aberration (lens/cornea distortion under intraocular pressure)
vec4 sampleChromaticAberration(vec2 uv, float intensity) {
    if (intensity <= 0.001) return texture2D(colorTexture, uv);

    vec2 dir = (uv - vec2(0.5)) * intensity * 0.02;
    float r = texture2D(colorTexture, clamp(uv + dir, 0.0, 1.0)).r;
    float g = texture2D(colorTexture, uv).g;
    float b = texture2D(colorTexture, clamp(uv - dir, 0.0, 1.0)).b;
    float a = texture2D(colorTexture, uv).a;

    return vec4(r, g, b, a);
}

// +Gz Blackout: Contrast Loss, Irregular Tunneling, Heartbeat Pulsing & Retinal Static
vec4 applyBlackout(vec2 uv, float heartbeat) {
    if (blackoutStrength <= 0.001) {
        return texture2D(colorTexture, uv);
    }

    // Dynamic G-strength modulated slightly by systolic heart pulses
    float dynamicG = clamp(blackoutStrength - (heartbeat * 0.08 * blackoutStrength), 0.0, 1.0);

    // 1. Radial Chromatic Aberration
    vec4 sceneColor = sampleChromaticAberration(uv, dynamicG * 0.8);

    // 2. Contrast Collapse (Greyout washes out highlights into mid-grey)
    float contrastLoss = clamp(dynamicG * 0.75, 0.0, 0.7);
    vec3 flatGrey = vec3(0.5);
    sceneColor.rgb = mix(sceneColor.rgb, flatGrey, contrastLoss);

    // 3. Color Desaturation
    float lum = getLuminance(sceneColor.rgb);
    sceneColor.rgb = mix(sceneColor.rgb, vec3(lum), clamp(dynamicG * 1.2, 0.0, 1.0));

    // 4. Organic, Non-Spherical Tunnel Vision Edge
    vec2 aspectUV = (uv - vec2(0.5)) * vec2(czm_viewport.z / czm_viewport.w, 1.0);
    float angle = atan(aspectUV.y, aspectUV.x);
    
    // Perturb radius with noise to simulate biological retinal ischemia boundaries
    float organicDistortion = sin(angle * 6.0 + u_time * 2.0) * 0.025 * dynamicG;
    float dist = length(aspectUV) + organicDistortion;

    float tunnelRadius = mix(0.75, 0.02, pow(dynamicG, 1.2));
    float edgeSoftness = mix(0.35, 0.06, dynamicG);
    float tunnelMask = smoothstep(tunnelRadius, tunnelRadius - edgeSoftness, dist);

    // 5. Retinal Starvation Static / Sparkles (Phosphenes near the collapsing boundary)
    float borderZone = smoothstep(0.12, 0.0, abs(dist - tunnelRadius)) * dynamicG;
    float staticNoise = hash(uv * 800.0 + fract(u_time * 10.0));
    vec3 noiseColor = vec3(staticNoise) * borderZone * 0.3;

    // Apply tunnel mask, noise, and final global dimming
    vec3 finalRGB = (sceneColor.rgb * tunnelMask) + noiseColor;
    float globalDarkening = 1.0 - smoothstep(0.7, 1.0, dynamicG);
    finalRGB *= globalDarkening;

    return vec4(finalRGB, sceneColor.a);
}

// -Gz Redout: Lower Eyelid Creep, Ocular Scattering & Heartbeat Red Flushes
vec4 applyRedout(vec4 inColor, vec2 uv, float heartbeat) {
    if (redoutStrength <= 0.001) {
        return inColor;
    }

    float str = clamp(redoutStrength, 0.0, 1.0);
    
    // Heartbeat causes red pressure flushes
    float pulseStr = clamp(str + (heartbeat * 0.15 * str), 0.0, 1.0);

    // 1. Lower Eyelid Intrusion (Skin & blood forced UPWARD over the eye)
    // Eyelid height rises from y = 0.0 up to 0.85
    float eyelidHeight = mix(-0.1, 0.85, pow(pulseStr, 1.1));
    float eyelidWave = sin(uv.x * 5.0) * 0.03; // Soft anatomical eyelid contour
    float eyelidMask = smoothstep(eyelidHeight, eyelidHeight - 0.3, uv.y + eyelidWave);

    // 2. Light passing through blood-filled tissue (Translucent dermal red shift)
    float lum = getLuminance(inColor.rgb);
    vec3 bloodTranslucency = vec3(
        clamp(lum * 1.4 + 0.25, 0.0, 1.0), 
        lum * 0.08,                        
        lum * 0.03                         
    );

    // 3. Dense Crimson Blood pooling at bottom of field
    vec3 deepCapillaryRed = vec3(0.55, 0.01, 0.01);
    
    // Mix scene with blood-translucency tint
    vec3 tintedScene = mix(inColor.rgb, bloodTranslucency, pulseStr * 0.8);

    // Apply the upper eyelid creep mask
    vec3 finalRedout = mix(deepCapillaryRed, tintedScene, eyelidMask);

    // 4. Retinal Ocular Pressure Glare (High pressure light scattering)
    float dist = getAspectDistance(uv);
    finalRedout += vec3(0.2, 0.01, 0.01) * pulseStr * (1.0 - dist) * heartbeat;

    return vec4(finalRedout, inColor.a);
}

void main() {
    vec2 uv = v_textureCoordinates;

    // Simulate high-G rapid heart rate (~170 BPM = ~2.83 Hz)
    float heartbeat = pow(max(0.0, sin(u_time * 17.8)), 3.0);

    // Process +Gz Blackout, then layer -Gz Redout
    vec4 blackoutColor = applyBlackout(uv, heartbeat);
    gl_FragColor = applyRedout(blackoutColor, uv, heartbeat);
}