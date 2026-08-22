'use client'

/**
 * BALAA STUDIOS — Hybrid Rendering Pipeline
 *
 * Coordinates:
 * 1. PBR Material & Environment reflections
 * 2. Hybrid Toon Lighting provider (preserves all maps & normal details)
 * 3. Soft contact shadows
 * 4. NPR Post-Processing layers (selective outlines, halftone, bloom)
 */

import { Environment, ContactShadows } from '@react-three/drei'
import { ToonMaterialProvider } from './ToonMaterialProvider'
import { NPRPostProcessing } from './NPRPostProcessing'
import { useAppStore } from '@/store/useAppStore'

export const HybridRenderingPipeline = () => {
  const renderMode = useAppStore((s) => s.renderMode)
  const isPbrOnly = renderMode === 'pbr-only'

  return (
    <>
      {/* 1. Subtle HDRI reflections for metallic & glossy materials */}
      <Environment preset="night" background={false} environmentIntensity={0.35} />

      {/* 2. Hybrid Toon Lighting Shader Injection (preserves all PBR textures) */}
      <ToonMaterialProvider />

      {/* 3. Soft Ground Contact Shadows */}
      <ContactShadows
        position={[0, -0.34, 0]}
        opacity={0.55}
        scale={14}
        blur={1.8}
        far={4}
        resolution={512}
        color="#09060b"
      />

      {/* 4. Layered NPR Post-Processing */}
      {!isPbrOnly && <NPRPostProcessing />}
    </>
  )
}
