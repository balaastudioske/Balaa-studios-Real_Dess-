'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'

interface StudioLightingProps {
  conceptMode?: boolean
  whiteStudio?: boolean
}

/**
 * PHASE 5 & Studio Presentation Lighting System
 *
 * Supports:
 *   - Clean White Studio fashion photography lighting (Images 2 & 3)
 *   - Cinematic Stage Lighting with soft shadows & mood presets
 */
export const StudioLighting: React.FC<StudioLightingProps> = ({
  conceptMode = false,
  whiteStudio = false,
}) => {
  const keyLightRef = useRef<THREE.DirectionalLight>(null!)
  const rimLightRef = useRef<THREE.SpotLight>(null!)
  const fillLightRef = useRef<THREE.DirectionalLight>(null!)

  const currentMood = useAppStore((s) => s.currentMood)
  const isPlaying = useAppStore((s) => s.isPlaying)
  const customLighting = useAppStore((s) => s.customLighting)

  // Color palette per mood preset
  const moodColors = {
    'blue-haze': { ambient: '#0f172a', key: '#fef08a', fill: '#38bdf8', rim: '#60a5fa' },
    'neon-club': { ambient: '#180828', key: '#f472b6', fill: '#818cf8', rim: '#c084fc' },
    'cyber-alley': { ambient: '#042f2e', key: '#fbbf24', fill: '#2dd4bf', rim: '#38bdf8' },
    sunset: { ambient: '#1c1917', key: '#fed7aa', fill: '#fb7185', rim: '#f59e0b' },
  }[currentMood || 'blue-haze'] || { ambient: '#09090b', key: '#fef3c7', fill: '#93c5fd', rim: '#a855f7' }

  const wasPlayingRef = useRef(false)

  useFrame(() => {
    if (conceptMode) return
    const pulse = isPlaying ? (useAppStore.getState().audioPulse || 0) : 0

    if (!isPlaying && !wasPlayingRef.current && !customLighting) {
      return // Idle: static lighting already set
    }
    wasPlayingRef.current = isPlaying

    if (keyLightRef.current) {
      const baseIntensity = whiteStudio ? 2.2 : (customLighting ? customLighting.keyLightIntensity : 2.8)
      keyLightRef.current.intensity = baseIntensity + pulse * 0.4
    }
    if (rimLightRef.current) {
      const baseRim = whiteStudio ? 0.8 : 3.2
      rimLightRef.current.intensity = baseRim + pulse * 0.3
    }
  })

  if (conceptMode) {
    return null
  }

  if (whiteStudio) {
    return (
      <group name="white_studio_lighting">
        <ambientLight color="#ffffff" intensity={1.2} />

        <directionalLight
          ref={keyLightRef}
          position={[3, 5, 4]}
          intensity={1.8}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
          shadow-bias={-0.0001}
        />

        <directionalLight
          ref={fillLightRef}
          position={[-3, 4, 3]}
          intensity={1.1}
          color="#f8fafc"
        />

        <spotLight
          ref={rimLightRef}
          position={[0, 0.8, 0.5]}
          intensity={0.55}
          color="#ffffff"
          angle={Math.PI / 4}
          penumbra={0.9}
          decay={2}
          distance={3}
        />
      </group>
    )
  }

  return (
    <group name="cinematic_stage_lighting">
      {/* 1. Ambient Ground/Sky Fill */}
      <ambientLight
        color={customLighting ? customLighting.ambientColor : moodColors.ambient}
        intensity={customLighting ? customLighting.ambientIntensity : 1.05}
      />

      {/* 2. Primary Key Light (Warm Key) */}
      <directionalLight
        ref={keyLightRef}
        position={[4, 6, 4]}
        intensity={customLighting ? customLighting.keyLightIntensity : 1.9}
        color={customLighting ? customLighting.keyLightColor : moodColors.key}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.5}
        shadow-camera-far={25}
        shadow-bias={-0.0001}
      />

      {/* 3. Cool Secondary Fill Light */}
      <directionalLight
        ref={fillLightRef}
        position={[-4, 3.5, 2.5]}
        intensity={0.95}
        color={moodColors.fill}
      />

      {/* 4. High-Energy Rim Spotlight */}
      <spotLight
        ref={rimLightRef}
        position={[0, 5.5, -3.5]}
        intensity={1.35}
        color={moodColors.rim}
        angle={Math.PI / 3.5}
        penumbra={0.7}
        distance={20}
      />

      {/* 5. Four open-air fixtures mounted directly to the pillars. */}
      <pointLight position={[-7.55, 5.75, -2.85]} intensity={0.7} color="#fef08a" distance={12} />
      <pointLight position={[7.55, 5.75, -2.85]} intensity={0.7} color="#fef08a" distance={12} />
      <pointLight position={[-7.55, 5.75, 2.85]} intensity={0.5} color="#38bdf8" distance={10} />
      <pointLight position={[7.55, 5.75, 2.85]} intensity={0.5} color="#38bdf8" distance={10} />
    </group>
  )
}
