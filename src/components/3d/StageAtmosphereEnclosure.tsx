'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'

const NUM_ATMOSPHERE_PARTICLES = 50

/**
 * StageAtmosphereEnclosure:
 * A sleek, architectural rectangular glass canopy & habitat enclosure framing the 4 corner pillars and roof.
 *
 * Visual Story:
 * - Sealed, climate-controlled performance habitat with breathable oxygen.
 * - Clean rectangular architectural glass walls matching the physical pillar grid (±7.8m X, ±3.1m Z, 6.45m roof).
 * - High-clarity optical glass with subtle Fresnel starfield reflections and cyan atmosphere tint.
 * - Floating micro-dust and oxygen particles drifting inside the sealed volume.
 */
export function StageAtmosphereEnclosure() {
  const isPlaying = useAppStore((s) => s.isPlaying)
  const audioPulse = useAppStore((s) => s.audioPulse)

  const particlesRef = useRef<THREE.Points>(null!)
  const pulseLightRef = useRef<THREE.PointLight>(null!)

  // 1. Oxygen / Micro-dust particles floating inside the rectangular stage habitat
  const { particlePositions, particleVelocities } = useMemo(() => {
    const pos = new Float32Array(NUM_ATMOSPHERE_PARTICLES * 3)
    const vel = new Float32Array(NUM_ATMOSPHERE_PARTICLES * 3)

    for (let i = 0; i < NUM_ATMOSPHERE_PARTICLES; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15.0
      pos[i * 3 + 1] = 0.2 + Math.random() * 5.8
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5.8

      vel[i * 3] = (Math.random() - 0.5) * 0.12
      vel[i * 3 + 1] = 0.04 + Math.random() * 0.08
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.12
    }

    return { particlePositions: pos, particleVelocities: vel }
  }, [])

  // Particle glow texture
  const particleTex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
    grad.addColorStop(0.4, 'rgba(186, 230, 253, 0.6)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 32, 32)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  // Lightweight Architectural Glass Material (Standard material to avoid heavy transmission buffer passes)
  const glassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e0f2fe',
        transparent: true,
        opacity: 0.12,
        roughness: 0.08,
        metalness: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  )

  // Smooth frame updates
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime()
    const pulse = isPlaying ? (audioPulse || 0) : 0

    // Oxygen particle drift
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute
      const posArr = posAttr.array as Float32Array

      for (let i = 0; i < NUM_ATMOSPHERE_PARTICLES; i++) {
        posArr[i * 3] += particleVelocities[i * 3] * delta
        posArr[i * 3 + 1] += particleVelocities[i * 3 + 1] * delta
        posArr[i * 3 + 2] += particleVelocities[i * 3 + 2] * delta

        if (posArr[i * 3 + 1] > 6.2) {
          posArr[i * 3 + 1] = 0.2
        }
        if (Math.abs(posArr[i * 3]) > 7.6) {
          posArr[i * 3] = (Math.random() - 0.5) * 6.0
        }
        if (Math.abs(posArr[i * 3 + 2]) > 3.0) {
          posArr[i * 3 + 2] = (Math.random() - 0.5) * 3.0
        }
      }
      posAttr.needsUpdate = true
    }

    if (pulseLightRef.current) {
      pulseLightRef.current.intensity = 0.5 + Math.sin(time * 2.0) * 0.12 + pulse * 0.35
    }
  })

  // Stage Frame Dimensions (matching corner pillars at ±7.8m X, ±3.1m Z, 6.45m height)
  const enclosureWidth = 15.6
  const enclosureDepth = 6.2
  const enclosureHeight = 6.45
  const halfH = enclosureHeight / 2

  return (
    <group name="STAGE_RECTANGULAR_ATMOSPHERE_ENCLOSURE">
      {/* 1. Glass Roof / Ceiling Panel */}
      <mesh position={[0, enclosureHeight, 0]} material={glassMaterial}>
        <boxGeometry args={[enclosureWidth, 0.03, enclosureDepth]} />
      </mesh>

      {/* 2. Front Transparent Glass Wall */}
      <mesh position={[0, halfH, enclosureDepth / 2]} material={glassMaterial}>
        <boxGeometry args={[enclosureWidth, enclosureHeight, 0.03]} />
      </mesh>

      {/* 3. Left Transparent Glass Wall */}
      <mesh position={[-enclosureWidth / 2, halfH, 0]} material={glassMaterial}>
        <boxGeometry args={[0.03, enclosureHeight, enclosureDepth]} />
      </mesh>

      {/* 4. Right Transparent Glass Wall */}
      <mesh position={[enclosureWidth / 2, halfH, 0]} material={glassMaterial}>
        <boxGeometry args={[0.03, enclosureHeight, enclosureDepth]} />
      </mesh>

      {/* Architectural Upper Frame Struts (connecting top of 4 pillars) */}
      <group position={[0, enclosureHeight, 0]}>
        {/* Front horizontal beam */}
        <mesh position={[0, 0, enclosureDepth / 2]}>
          <boxGeometry args={[enclosureWidth, 0.08, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.2} />
        </mesh>
        {/* Rear horizontal beam */}
        <mesh position={[0, 0, -enclosureDepth / 2]}>
          <boxGeometry args={[enclosureWidth, 0.08, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.2} />
        </mesh>
        {/* Left horizontal beam */}
        <mesh position={[-enclosureWidth / 2, 0, 0]}>
          <boxGeometry args={[0.08, 0.08, enclosureDepth]} />
          <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.2} />
        </mesh>
        {/* Right horizontal beam */}
        <mesh position={[enclosureWidth / 2, 0, 0]}>
          <boxGeometry args={[0.08, 0.08, enclosureDepth]} />
          <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.2} />
        </mesh>
      </group>

      {/* Floating Micro-Dust / Oxygen Particles inside Habitat */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={particleTex}
          size={0.16}
          color="#bae6fd"
          transparent={true}
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>

      {/* Ambient Internal Habitat Glow Light */}
      <pointLight
        ref={pulseLightRef}
        position={[0, 3.2, 0]}
        color="#bae6fd"
        intensity={0.5}
        distance={10}
        decay={1.8}
      />
    </group>
  )
}
