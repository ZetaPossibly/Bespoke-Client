uniform sampler2D colorTexture;
varying vec2 v_textureCoordinates;

uniform float blackoutStrength; // +Gz force (0.0 to 1.0)
uniform float redoutStrength;   // -Gz force (0.0 to 1.0)

// Fast, high-frequency spatial noise (simulates starving photoreceptor noise)
float pseudoNoise(vec2 uv) {
    return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
}

// Aspect-ratio-corrected UV distance from screen center
float getAspectDistance(vec2 uv) {
    vec2 aspectUV = (uv - vec2(0.5)) * vec2(czm_viewport.z / czm_viewport.w, 1.0);
    return length(aspectUV);
}

// 5-tap radial optic blur along vision axes
vec4 applyRadialBlur(vec2 uv, float intensity) {
    if (intensity <= 0.0001) {
        return texture2D(colorTexture, uv);
    }
    
    vec2 dir = uv - vec2(0.5);
    vec4 colorSum = vec4(0.0);
    
    // Fixed GLSL ES 1.0 / WebGL 1 loop count
    for (int i = 0; i < 5; i++) {
        vec2 sampleUV = uv - dir * (float(i) * intensity * 0.008);
        colorSum += texture2D(colorTexture, clamp(sampleUV, 0.0, 1.0));
    }
    
    return colorSum / 5.0;
}

// +Gz Blackout: Purkinje Greyout -> Retinal Noise -> Tunneling -> Total Darkness
vec4 applyBlackout(vec2 uv) {
    if (blackoutStrength <= 0.0001) {
        return texture2D(colorTexture, uv);
    }

    float str = clamp(blackoutStrength, 0.0, 1.0);
    float dist = getAspectDistance(uv);

    // 1. Radial Optic Blur (Scales exponentially with strength to preserve clear onset)
    float blurFactor = pow(str, 1.6) * (0.2 + dist * 0.8);
    vec4 sceneColor = applyRadialBlur(uv, blurFactor);

    // 2. Purkinje Scotopic Shift (Cone loss -> Rod monochrome transition)
    // Rods are insensitive to red (0.05) and sensitive to green/blue (0.60, 0.35)
    float scotopicLum = dot(sceneColor.rgb, vec3(0.05, 0.60, 0.35));
    
    // Peripheral greyout onset (smooth exponential curve)
    float desatAmount = clamp(pow(str, 1.2) * 1.1 + (dist * str * 0.5), 0.0, 1.0);
    vec3 desaturatedRGB = mix(sceneColor.rgb, vec3(scotopicLum), desatAmount);

    // 3. Retinal Ischemic Static / Visual Grain
    float visualNoise = (pseudoNoise(uv * 400.0) - 0.5) * 0.07 * pow(str, 0.8);
    vec3 noisyRGB = clamp(desaturatedRGB + vec3(visualNoise), 0.0, 1.0);

    // 4. Dynamic Tunnel Radius Curve (Guarantees silky-smooth onset)
    // str = 0.05 -> tunnelRadius ~ 1.6 (offscreen, 0% harsh circle)
    // str = 0.50 -> tunnelRadius ~ 0.7 (peripheral field contracting)
    // str = 1.00 -> tunnelRadius = 0.0 (total blackout)
    float tunnelRadius = mix(1.8, 0.0, pow(str, 0.75));
    float edgeSoftness = mix(0.75, 0.15, str);
    float tunnelMask = smoothstep(tunnelRadius, tunnelRadius - edgeSoftness, dist);

    // 5. Combine Tunnel Mask and Global Dimming
    vec3 finalRGB = noisyRGB * tunnelMask;

    // Smooth overall screen blackout at severe levels (>0.65)
    float globalDarkening = 1.0 - smoothstep(0.65, 1.0, str);
    finalRGB *= globalDarkening;

    return vec4(finalRGB, sceneColor.a);
}

// -Gz Redout: Blood-absorption filter + Eyelid engorgement + Crimson veiling glare
vec4 applyRedout(vec4 inColor, vec2 uv) {
    if (redoutStrength <= 0.0001) {
        return inColor;
    }

    float str = clamp(redoutStrength, 0.0, 1.0);
    float dist = getAspectDistance(uv);

    // 1. Ocular Blood Absorption Spectrum (Green/Blue light absorbed by eye blood)
    float photopicLum = dot(inColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    vec3 bloodTint = vec3(
        clamp(photopicLum * 1.35 + 0.15, 0.0, 1.0), // Red channel filtered through capillaries
        photopicLum * 0.10,                        // Green channel absorbed
        photopicLum * 0.04                         // Blue channel absorbed
    );

    // Smooth tint onset
    float tintAmount = pow(str, 1.1);
    vec3 tintedScene = mix(inColor.rgb, bloodTint, tintAmount * 0.85);

    // 2. Lower-eyelid Blood Pooling (-G forces force blood into lower eyelids/retinal bottom)
    float lowerEyelidBias = pow(1.0 - uv.y, 2.2) * 0.45; 
    float edgeRedFactor = smoothstep(0.2, 0.95, dist + lowerEyelidBias) * pow(str, 0.9);

    vec3 deepBloodRed = vec3(0.48, 0.01, 0.01);
    vec3 pooledRGB = mix(tintedScene, deepBloodRed, edgeRedFactor);

    // 3. Intraocular Veiling Glare / Light Scattering
    // High intraocular blood pressure scatters scene brightness into crimson halos
    vec3 crimsonBloom = vec3(photopicLum * 0.35, photopicLum * 0.01, 0.0) * pow(str, 1.2);
    vec3 finalRedoutRGB = clamp(pooledRGB + crimsonBloom, 0.0, 1.0);

    return vec4(finalRedoutRGB, inColor.a);
}

void main() {
    vec2 uv = v_textureCoordinates;
    
    // Process +Gz Blackout first, then apply -Gz Redout
    vec4 blackoutColor = applyBlackout(uv);
    gl_FragColor = applyRedout(blackoutColor, uv);
}