import * as THREE from 'three'

/**
 * Creates a clean 3-band cel shading ramp texture.
 * Bands:
 * 0.00 – 0.35: Dark shadow (#1a121e)
 * 0.35 – 0.70: Mid-tone (#6b5470)
 * 0.70 – 1.00: Key highlight (#ffffff)
 */
export function createLightingRampTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d')!

  const dark = 0x181020
  const mid = 0x6e5274
  const highlight = 0xffffff

  const imageData = ctx.createImageData(256, 1)
  const data = new Uint8ClampedArray(256 * 4)

  for (let i = 0; i < 256; i++) {
    const t = i / 255
    let color: number
    if (t < 0.38) {
      color = dark
    } else if (t < 0.72) {
      color = mid
    } else {
      color = highlight
    }
    const r = (color >> 16) & 0xff
    const g = (color >> 8) & 0xff
    const b = color & 0xff
    const idx = i * 4
    data[idx] = r
    data[idx + 1] = g
    data[idx + 2] = b
    data[idx + 3] = 255
  }

  imageData.data.set(data)
  ctx.putImageData(imageData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.needsUpdate = true
  return texture
}

export const celVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const celFragmentShader = `
uniform sampler2D uLightingRamp;
uniform vec3 uBaseColor;
uniform float uTime;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;

void main() {
  vec3 lightDir = normalize(vec3(0.8, 1.2, 1.0));
  vec3 normal = normalize(vNormal);
  
  float ndotl = max(dot(normal, lightDir), 0.0);
  vec3 rampColor = texture2D(uLightingRamp, vec2(ndotl, 0.5)).rgb;
  vec3 color = uBaseColor * rampColor;
  
  gl_FragColor = vec4(color, 1.0);
}
`
