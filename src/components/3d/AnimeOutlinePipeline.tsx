'use client'
import { EffectComposer, Outline, Bloom } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { RefObject } from 'react'
import * as THREE from 'three'

interface AnimeOutlinePipelineProps {
  selection: RefObject<THREE.Object3D>
}

export const AnimeOutlinePipeline = ({ selection }: AnimeOutlinePipelineProps) => {
  return (
    <EffectComposer>
      <Outline
        selection={selection}
        edgeStrength={4.0}
        xRay={true}
        visibleEdgeColor={0x0a0f1d}
        hiddenEdgeColor={0x000000}
        kernelSize={3}
      />
      <Bloom
        blendFunction={BlendFunction.MULTIPLY}
        intensity={0.1}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.1}
      />
    </EffectComposer>
  )
}
