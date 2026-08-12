uniform sampler2D colorTexture;
varying vec2 v_textureCoordinates;
uniform float blackoutStrength;
uniform float redoutStrength;

vec4 vignette(float strength, vec2 coordinate, vec2 texCoord) {
    vec2 uv = coordinate.xy / czm_viewport.zw;  
    uv *= 1.0 - uv.yx;
    
    float vig = (uv.x * uv.y) * 15.0; 
    vig = pow(clamp(vig, 0.001, 1.0), strength);
    return mix(vec4(vig), texture2D(colorTexture, texCoord), vig); 
}

vec4 grayOut(float strength, vec2 coordinate, vec2 texCoord) {
  vec4 initialCol = vignette(strength * 20.0, coordinate, texCoord);
  vec4 grayCol = vec4(vec3(initialCol.r), 1.0);
  return mix(initialCol, grayCol, clamp(strength * 3.0, 0.0, 1.0));
}

vec4 blur(float strength, vec2 coordinate, vec2 texCoord) {
  if (strength <= 0.001) return texture2D(colorTexture, texCoord);
  
  float radius = strength / 10.0;
  vec4 initialCol  = grayOut(strength, coordinate, texCoord);
  vec4 blurCol1    = grayOut(strength, coordinate + vec2(radius, 0.0), texCoord + vec2(radius, 0.0));
  vec4 blurCol2    = grayOut(strength, coordinate + vec2(-radius, 0.0), texCoord + vec2(-radius, 0.0));
  vec4 blurCol3    = grayOut(strength, coordinate + vec2(0.0, radius), texCoord + vec2(0.0, radius));
  vec4 blurCol4    = grayOut(strength, coordinate + vec2(0.0, -radius), texCoord + vec2(0.0, -radius));
  vec4 blurColr1   = grayOut(strength, coordinate + vec2(radius, radius), texCoord + vec2(radius, radius));
  vec4 blurColr2   = grayOut(strength, coordinate + vec2(radius, -radius), texCoord + vec2(radius, -radius));
  vec4 blurColr3   = grayOut(strength, coordinate + vec2(-radius, -radius), texCoord + vec2(-radius, -radius));
  vec4 blurColr4   = grayOut(strength, coordinate + vec2(-radius, -radius), texCoord + vec2(-radius, -radius));
  return mix(initialCol, mix(vec4(blurCol1 + blurCol2 + blurCol3 + blurCol4) / 4.0, vec4(blurColr1 + blurColr2 + blurColr3 + blurColr4) / 4.0, 0.25), clamp(strength * 2.0, 0.0, 1.0));
}

vec4 applyRedout(vec4 inColor, float strength, vec2 coordinate) {
  if (strength <= 0.001) return inColor;

  vec2 uv = coordinate.xy / czm_viewport.zw;
  float distFromCenter = length(uv - vec2(0.5));
  
  // Creates blood-flooded red vision matrix
  vec3 redTint = vec3(
    clamp(inColor.r * 1.4 + 0.35, 0.0, 1.0), 
    inColor.g * 0.15, 
    inColor.b * 0.15
  );

  // Vignette effect pushing deep red around edges (blood gorging in eyelids/eyes)
  float edgeRed = smoothstep(0.2, 0.8, distFromCenter) * strength;
  float totalRedout = clamp(strength + edgeRed * 0.4, 0.0, 1.0);

  return vec4(mix(inColor.rgb, redTint, totalRedout), inColor.a);
}

void main() {
  vec4 blackoutColor = blur(blackoutStrength, gl_FragCoord.xy, v_textureCoordinates);
  gl_FragColor = applyRedout(blackoutColor, redoutStrength, gl_FragCoord.xy);
}