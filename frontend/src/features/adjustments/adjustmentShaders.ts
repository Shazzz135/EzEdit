export const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform sampler2D u_image;
uniform vec2 u_resolution;

uniform float u_exposure;
uniform float u_brilliance;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_saturation;
uniform float u_vibrance;
uniform float u_warmth;
uniform float u_tint;
uniform float u_sharpness;
uniform float u_definition;
uniform float u_noise;

void main() {
  vec4 base = texture(u_image, v_texCoord);
  if (base.a <= 0.0) {
    outColor = vec4(0.0);
    return;
  }

  vec3 color = base.rgb / max(base.a, 0.0001);
  vec2 onePixel = vec2(1.0) / max(u_resolution, vec2(1.0));

  // 1. Convolution for Sharpness, Definition & Noise Reduction
  if (u_sharpness > 0.0 || u_definition > 0.0 || u_noise > 0.0) {
    vec3 up = texture(u_image, v_texCoord + vec2(0.0, -onePixel.y)).rgb;
    vec3 down = texture(u_image, v_texCoord + vec2(0.0, onePixel.y)).rgb;
    vec3 left = texture(u_image, v_texCoord + vec2(-onePixel.x, 0.0)).rgb;
    vec3 right = texture(u_image, v_texCoord + vec2(onePixel.x, 0.0)).rgb;

    if (u_sharpness > 0.0) {
      vec3 laplacian = 4.0 * color - (up + down + left + right);
      color += laplacian * (u_sharpness / 100.0) * 0.45;
    }
    if (u_definition > 0.0) {
      color += (color - 0.5) * (u_definition / 100.0) * 0.25;
    }
    if (u_noise > 0.0) {
      vec3 neighbors = (up + down + left + right) * 0.25;
      color = mix(color, neighbors, (u_noise / 100.0) * 0.35);
    }
  }

  // 2. Exposure & Brightness
  color *= pow(2.0, u_exposure);
  color += vec3(u_brightness / 200.0);

  // 3. Contrast
  color = (color - 0.5) * (1.0 + u_contrast / 100.0) + 0.5;

  // 4. Luminance calculations for highlights, shadows & brilliance
  float lum = dot(color, vec3(0.2126, 0.7152, 0.0722));

  // Highlights & Shadows
  if (u_highlights != 0.0) {
    float hWeight = smoothstep(0.35, 1.0, lum);
    color += color * (u_highlights / 100.0) * hWeight * 0.5;
  }
  if (u_shadows != 0.0) {
    float sWeight = 1.0 - smoothstep(0.0, 0.65, lum);
    color += (1.0 - color) * (u_shadows / 100.0) * sWeight * 0.5;
  }

  // Brilliance (adaptive midtones curve)
  if (u_brilliance != 0.0) {
    float bWeight = sin(clamp(lum, 0.0, 1.0) * 3.14159265);
    color += vec3((u_brilliance / 100.0) * bWeight * 0.25);
  }

  // 5. Saturation & Vibrance
  lum = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color = mix(vec3(lum), color, max(0.0, 1.0 + u_saturation / 100.0));

  if (u_vibrance != 0.0) {
    float maxC = max(color.r, max(color.g, color.b));
    float minC = min(color.r, min(color.g, color.b));
    float sat = maxC - minC;
    color = mix(vec3(lum), color, max(0.0, 1.0 + (u_vibrance / 100.0) * (1.0 - sat)));
  }

  // 6. Warmth (Color Temp: +Amber / -Cyan)
  color.r += (u_warmth / 100.0) * 0.15;
  color.b -= (u_warmth / 100.0) * 0.15;

  // 7. Tint (+Green / -Magenta)
  color.g += (u_tint / 100.0) * 0.15;
  color.r -= (u_tint / 100.0) * 0.075;
  color.b -= (u_tint / 100.0) * 0.075;

  color = clamp(color, 0.0, 1.0);
  outColor = vec4(color * base.a, base.a);
}
`
