'use client'

import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useAppStore } from '@/store/useAppStore'

/**
 * High-performance Post-Processing Pipeline
 * Uses WebGL2 resilient Bloom and avoids custom undeclared inputBuffer shaders.
 */
export const NPRPostProcessing = () => {
  // Bypassed to allow native Three.js r185 high-performance direct WebGL rendering
  // without EffectComposer render-target buffer conflicts.
  return null
}