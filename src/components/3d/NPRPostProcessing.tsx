'use client'

/**
 * BALAA STUDIOS — 2.5D Impressionistic Hand-Drawn NPR Shading Pipeline
 *
 * 1. Impressionistic Hand-Drawn Ink Lines:
 *    - Crisp Sobel contour and silhouette edge shading lines on characters and 3D objects.
 *    - Organic hand-drawn ink modulation for that authentic graphic / 2.5D anime / Arcane style.
 * 2. Tonal Impressionism & Compressed Asset Shading:
 *    - Stepped tonal bands with subtle cross-hatching and halftone penumbra.
 *    - Backs lower-resolution and compressed textures to look deliberate, sharp, and high-art.
 * 3. Extreme Efficiency:
 *    - Zero-allocation single-pass shader execution optimized for smooth 60fps on any device.
 */

import { EffectComposer, wrapEffect, Bloom } from '@react-three/postprocessing'
import { Effect, BlendFunction } from 'postprocessing'
import { Uniform } from 'three'
import { useAppStore } from '@/store/useAppStore'
import { useMemo } from 'react'

const fragmentShader = `
uniform float uHalftoneScale;
uniform float uEnableOutline;
uniform float uEnableHalftone;
uniform float uCMYKFringe;
uniform float uColorSteps;
uniform float uTime;

// Hand-drawn cross-hatch pattern for impressionistic shadow penumbra
float impressionistHatch(vec2 uv, float scale, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  vec2 rotUV = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y) * scale;
  float line1 = abs(sin(rotUV.x * 3.14159));
  return smoothstep(0.72, 0.98, line1);
}

// Screen-space halftone pattern
float halftoneGrid(vec2 uv, float scale) {
  vec2 p = uv * scale;
  vec2 grid = fract(p) - 0.5;
  return length(grid);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // 1. Subtle chromatic print misregistration (stylized comic / illustration edge)
  vec4 colorR = texture2D(inputBuffer, uv + vec2(uCMYKFringe, 0.0));
  vec4 colorG = texture2D(inputBuffer, uv);
  vec4 colorB = texture2D(inputBuffer, uv - vec2(uCMYKFringe, 0.0));

  vec3 baseColor = vec3(colorR.r, colorG.g, colorB.b);

  // 2. Stepped Color Smoothing (Preserves texture clarity while creating graphic cell bands)
  vec3 steppedColor = floor(baseColor * uColorSteps) / uColorSteps;
  vec3 blended = mix(baseColor, steppedColor, 0.60); // 60% graphic cell quantize for gritty comic look

  float lum = dot(blended, vec3(0.299, 0.587, 0.114));

  // 3. 2.5D Impressionistic Hand-Drawn Ink Silhouette & Crease Lines
  if (uEnableOutline > 0.5) {
    vec2 texel = vec2(1.0 / 1920.0, 1.0 / 1080.0);
    vec4 cN = texture2D(inputBuffer, uv + vec2(0.0, texel.y * 1.6));
    vec4 cS = texture2D(inputBuffer, uv - vec2(0.0, texel.y * 1.6));
    vec4 cE = texture2D(inputBuffer, uv + vec2(texel.x * 1.6, 0.0));
    vec4 cW = texture2D(inputBuffer, uv - vec2(texel.x * 1.6, 0.0));

    float lumN = dot(cN.rgb, vec3(0.299, 0.587, 0.114));
    float lumS = dot(cS.rgb, vec3(0.299, 0.587, 0.114));
    float lumE = dot(cE.rgb, vec3(0.299, 0.587, 0.114));
    float lumW = dot(cW.rgb, vec3(0.299, 0.587, 0.114));

    float edge = abs(lumN - lumS) + abs(lumE - lumW);

    // Subtle paper tooth / ink stroke modulation
    float inkMod = 0.92 + 0.16 * sin(uv.x * 900.0 + uv.y * 700.0);

    if (edge > 0.18) {
      float lineIntensity = clamp((edge - 0.18) * 3.4 * inkMod, 0.0, 0.85);
      blended *= (1.0 - lineIntensity);
    }
  }

  // 4. Impressionistic Hatching & Halftone in Mid-Shadows
  if (uEnableHalftone > 0.5 && lum < 0.45 && lum > 0.08) {
    // Halftone dots in deeper shadow
    float dotPattern = halftoneGrid(uv, uHalftoneScale);
    float dotThreshold = clamp(1.0 - lum, 0.0, 0.65);
    if (dotPattern < dotThreshold * 0.32) {
      blended *= 0.88;
    }
    
    // Light cross-hatch texture on midtone gradients
    if (lum > 0.22 && lum < 0.38) {
      float hatch = impressionistHatch(uv, uHalftoneScale * 1.8, 0.785);
      blended *= (1.0 - hatch * 0.12);
    }
  }

  outputColor = vec4(blended, inputColor.a);
}
`

class BalaaHybridNPREffect extends Effect {
  constructor(
    options: {
      halftoneScale?: number
      enableOutline?: number
      enableHalftone?: number
      cmykFringe?: number
      colorSteps?: number
      blendFunction?: BlendFunction
    } = {}
  ) {
    const uniforms = new Map<string, Uniform>([
      ['uHalftoneScale', new Uniform(options.halftoneScale ?? 120.0)],
      ['uEnableOutline', new Uniform(options.enableOutline ?? 1.0)],
      ['uEnableHalftone', new Uniform(options.enableHalftone ?? 1.0)],
      ['uCMYKFringe', new Uniform(options.cmykFringe ?? 0.0006)],
      ['uColorSteps', new Uniform(options.colorSteps ?? 8.0)],
      ['uTime', new Uniform(0)],
    ])

    super('BalaaHybridNPREffect', fragmentShader, {
      blendFunction: options.blendFunction ?? BlendFunction.NORMAL,
      uniforms,
    })
  }

  update(_renderer: any, _inputBuffer: any, deltaTime?: number) {
    const t = this.uniforms.get('uTime')
    if (t) {
      t.value = (t.value ?? 0) + (deltaTime ?? 0)
    }
  }
}

const BalaaHybridNPREffectComponent = /* @__PURE__ */ wrapEffect(
  BalaaHybridNPREffect
)

export const NPRPostProcessing = () => {
  const renderMode = useAppStore((s) => s.renderMode)

  const config = useMemo(() => {
    switch (renderMode) {
      case 'pbr-only':
        return {
          enableOutline: 0.0,
          enableHalftone: 0.0,
          cmykFringe: 0.0,
          colorSteps: 256.0,
        }
      case 'pbr-toon':
        return {
          enableOutline: 0.0,
          enableHalftone: 0.0,
          cmykFringe: 0.0,
          colorSteps: 12.0,
        }
      case 'pbr-toon-outline':
        return {
          enableOutline: 1.0,
          enableHalftone: 0.0,
          cmykFringe: 0.0006,
          colorSteps: 10.0,
        }
      case 'pbr-toon-halftone':
        return {
          enableOutline: 0.0,
          enableHalftone: 1.0,
          cmykFringe: 0.0006,
          colorSteps: 10.0,
        }
      case 'npr-anime':
        return {
          enableOutline: 1.0,
          enableHalftone: 1.0,
          cmykFringe: 0.001,
          colorSteps: 6.0,
        }
      case 'balaa-hybrid':
      case 'npr-story':
      default:
        // Signature BALAA 2.5D Impressionistic Hybrid
        return {
          enableOutline: 1.0,
          enableHalftone: 1.0,
          cmykFringe: 0.0006,
          colorSteps: 8.0,
        }
    }
  }, [renderMode])

  if (renderMode === 'pbr-only') {
    return null
  }

  return (
    <EffectComposer multisampling={0}>
      <BalaaHybridNPREffectComponent
        halftoneScale={130.0}
        enableOutline={config.enableOutline}
        enableHalftone={config.enableHalftone}
        cmykFringe={config.cmykFringe}
        colorSteps={config.colorSteps}
      />
      <Bloom
        blendFunction={BlendFunction.ADD}
        intensity={0.55}
        luminanceThreshold={0.84}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
    </EffectComposer>
  )
}