export const positionComputeShader = `
precision highp float;
uniform sampler2D uPositionTexture;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(uPositionTexture, uv).xyz;
  vec3 vel = texture2D(uVelocityTexture, uv).xyz;

  pos += vel * 0.016;

  // Bounds wrapping
  if (pos.x > 10.0) pos.x = -10.0;
  if (pos.x < -10.0) pos.x = 10.0;
  if (pos.y > 10.0) pos.y = -10.0;
  if (pos.y < -10.0) pos.y = 10.0;
  if (pos.z > 10.0) pos.z = -10.0;
  if (pos.z < -10.0) pos.z = 10.0;

  gl_FragColor = vec4(pos, 1.0);
}
`

export const velocityComputeShader = `
precision highp float;
uniform float uTime;
uniform sampler2D uVelocityTexture;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

vec3 noiseVec(vec3 p) {
  return vec3(
    hash(p),
    hash(p + vec3(1.23, 4.56, 7.89)),
    hash(p + vec3(9.87, 6.54, 3.21))
  ) * 2.0 - vec3(1.0);
}

vec3 curlNoise(vec3 p) {
  float eps = 0.1;
  vec3 dx = vec3(eps, 0.0, 0.0);
  vec3 dy = vec3(0.0, eps, 0.0);
  vec3 dz = vec3(0.0, 0.0, eps);

  float tx = (noiseVec(p + dy).x - noiseVec(p - dy).x) / (2.0 * eps);
  float ty = (noiseVec(p + dz).y - noiseVec(p - dz).y) / (2.0 * eps);
  float tz = (noiseVec(p + dx).z - noiseVec(p - dx).z) / (2.0 * eps);

  return normalize(vec3(ty - tz, tz - tx, tx - ty));
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 pos = texture2D(uPositionTexture, uv).xyz;
  vec3 vel = texture2D(uVelocityTexture, uv).xyz;

  vec3 velocity = curlNoise(pos * 0.4 + vec3(0.0, uTime * 0.1, 0.0));
  vel = mix(vel, velocity, 0.15);

  gl_FragColor = vec4(vel, 1.0);
}
`
