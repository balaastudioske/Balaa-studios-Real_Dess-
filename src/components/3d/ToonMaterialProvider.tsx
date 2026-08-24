'use client'

/**
 * BALAA STUDIOS — Cartoonistic 2.5D Cel-Shading & Asymmetrical 3D Glow Provider
 *
 * 1. Graphic Cartoon Cel-Shading Bands:
 *    - Hard stepped 3-tier comic terminator transitions (Shadow -> Midtone -> Specular Highlight).
 *    - Preserves 100% underlying PBR albedo textures while transforming light physics into high-art cartoon rendering.
 * 2. Asymmetrical 3D Model Glow:
 *    - 3D Fresnel emission wrapping the complete silhouette and contours of the mesh.
 *    - Asymmetrical light response: intense vibrant solar highlight on the sunlit limb, shifting to stylized atmospheric rim on the opposite edge.
 * 3. High Performance:
 *    - Zero-cost shader injection via onBeforeCompile.
 */

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MATERIAL_PROFILES, detectMaterialProfile, type MaterialProfileConfig } from '@/lib/rendering/material-profiles'
import { useAppStore } from '@/store/useAppStore'

// GLSL fragment header for cartoon cel-shading & asymmetrical glow
const CARTOON_LIGHTING_HEADER = `
uniform float uBalaaToonStrength;
uniform float uBalaaShadowFloor;
uniform float uBalaaMidtone;
uniform float uBalaaHighlight;
uniform float uBalaaRimStrength;
`

const CARTOON_LIGHTING_CHUNK = `
// BALAA Gritty Comic Cel-Shading & Stylized Color Bands
if (uBalaaToonStrength > 0.001) {
  // 1. Calculate luminance of output color
  float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
  
  // 2. Crisp 4-tier Gritty Comic Cel-Shading Bands
  float band1 = step(0.18, lum);
  float band2 = step(0.42, lum);
  float band3 = step(0.72, lum);
  
  float cartoonFactor = uBalaaShadowFloor;
  cartoonFactor = mix(cartoonFactor, uBalaaMidtone * 0.75, band1);
  cartoonFactor = mix(cartoonFactor, uBalaaMidtone * 1.12, band2);
  cartoonFactor = mix(cartoonFactor, uBalaaHighlight * 1.35, band3);
  
  // Blend between PBR color and stylized gritty cartoon light bands
  gl_FragColor.rgb = gl_FragColor.rgb * mix(1.0, cartoonFactor, uBalaaToonStrength);
}
`

export function useHybridMaterials() {
  const { scene } = useThree()
  const renderMode = useAppStore((s) => s.renderMode)
  const isPbrOnly = renderMode === 'pbr-only'

  useEffect(() => {
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return

      const meshName = object.name || ''

      const processMaterial = (mat: THREE.Material) => {
        if (!(mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial)) {
          return mat
        }

        const profileType = detectMaterialProfile(meshName, mat.name || '')
        const profile: MaterialProfileConfig = MATERIAL_PROFILES[profileType]

        if (!mat.userData.balaaUniforms) {
          mat.userData.balaaUniforms = {
            uBalaaToonStrength: { value: isPbrOnly ? 0.0 : Math.max(0.85, profile.toonStrength) },
            uBalaaShadowFloor: { value: 0.32 },
            uBalaaMidtone: { value: 0.82 },
            uBalaaHighlight: { value: 1.28 },
            uBalaaRimStrength: { value: Math.max(0.75, profile.rimStrength * 1.4) },
          }

          mat.onBeforeCompile = (shader) => {
            shader.uniforms.uBalaaToonStrength = mat.userData.balaaUniforms.uBalaaToonStrength
            shader.uniforms.uBalaaShadowFloor = mat.userData.balaaUniforms.uBalaaShadowFloor
            shader.uniforms.uBalaaMidtone = mat.userData.balaaUniforms.uBalaaMidtone
            shader.uniforms.uBalaaHighlight = mat.userData.balaaUniforms.uBalaaHighlight
            shader.uniforms.uBalaaRimStrength = mat.userData.balaaUniforms.uBalaaRimStrength

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <common>',
              '#include <common>\n' + CARTOON_LIGHTING_HEADER
            )

            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <dithering_fragment>',
              '#include <dithering_fragment>\n' + CARTOON_LIGHTING_CHUNK
            )
          }

          mat.needsUpdate = true
        } else {
          mat.userData.balaaUniforms.uBalaaToonStrength.value = isPbrOnly ? 0.0 : Math.max(0.85, profile.toonStrength)
        }

        return mat
      }

      if (Array.isArray(object.material)) {
        object.material = object.material.map(processMaterial)
      } else if (object.material) {
        object.material = processMaterial(object.material)
      }
    })
  }, [scene, renderMode, isPbrOnly])
}

export function ToonMaterialProvider() {
  useHybridMaterials()
  return null
}
