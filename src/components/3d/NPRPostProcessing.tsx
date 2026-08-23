'use client'

import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useAppStore } from '@/store/useAppStore'

/**
 * High-performance Post-Processing Pipeline
 * Uses WebGL2 resilient Bloom and avoids custom undeclared inputBuffer shaders.
 */
export const NPRPostProcessing = () => {
  const renderMode = useAppStore((s) => s.renderMode)

  if (renderMode === 'pbr-only') {
    return null
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        blendFunction={BlendFunction.ADD}
        intensity={0.45}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
    </EffectComposer>
  )
}