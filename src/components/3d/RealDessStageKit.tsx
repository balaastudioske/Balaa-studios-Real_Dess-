'use client'

import { useRef, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { useAppStore } from '@/store/useAppStore'

// Helper to create a procedural Nairobi sunset skyline canvas texture
function createSunsetSkylineTexture(): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture(null as any)
  }
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(canvas)

  // Gradient sky: Deep rose to golden amber sunset
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 512)
  skyGrad.addColorStop(0, '#581c87') // deep purple/dusk at top
  skyGrad.addColorStop(0.25, '#9d174d') // rose
  skyGrad.addColorStop(0.55, '#ea580c') // orange
  skyGrad.addColorStop(0.75, '#f59e0b') // golden amber
  skyGrad.addColorStop(0.92, '#fef08a') // bright sunset horizon
  skyGrad.addColorStop(1, '#ca8a04') // ground glow
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, 1024, 512)

  // Warm sun glow near horizon center-left
  const sunGrad = ctx.createRadialGradient(280, 360, 20, 280, 360, 220)
  sunGrad.addColorStop(0, 'rgba(255, 255, 230, 0.95)')
  sunGrad.addColorStop(0.3, 'rgba(251, 191, 36, 0.7)')
  sunGrad.addColorStop(0.7, 'rgba(234, 88, 12, 0.3)')
  sunGrad.addColorStop(1, 'rgba(157, 23, 77, 0)')
  ctx.fillStyle = sunGrad
  ctx.fillRect(0, 0, 1024, 512)

  // Distant Nairobi skyline silhouettes (including iconic KICC cylinder & spire)
  ctx.fillStyle = '#1e1026'

  // KICC Iconic Tower (Center-left)
  ctx.fillRect(260, 240, 48, 160) // main body
  // Cylindrical tiers of KICC
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(256 - i * 2, 240 + i * 28, 56 + i * 4, 12)
  }
  // Helipad / Saucer top
  ctx.beginPath()
  ctx.ellipse(284, 236, 36, 12, 0, 0, Math.PI * 2)
  ctx.fill()
  // Spire
  ctx.fillRect(282, 170, 4, 66)

  // Additional skyline towers
  ctx.fillRect(80, 280, 35, 120)
  ctx.fillRect(130, 310, 50, 90)
  ctx.fillRect(195, 260, 40, 140)
  ctx.fillRect(330, 290, 45, 110)
  ctx.fillRect(390, 270, 55, 130)
  ctx.fillRect(470, 320, 60, 80)
  ctx.fillRect(550, 285, 38, 115)
  ctx.fillRect(610, 250, 48, 150)
  ctx.fillRect(680, 295, 42, 105)
  ctx.fillRect(745, 275, 52, 125)
  ctx.fillRect(820, 305, 44, 95)
  ctx.fillRect(880, 260, 60, 140)
  ctx.fillRect(960, 300, 50, 100)

  // Subtle warm sunset clouds
  ctx.fillStyle = 'rgba(254, 215, 170, 0.25)'
  ctx.beginPath()
  ctx.ellipse(350, 160, 180, 24, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(750, 190, 220, 30, 0, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

export type StageItemId =
  | 'main_stage'
  | 'truss_left'
  | 'truss_right'
  | 'top_truss'
  | 'speaker_left'
  | 'speaker_right'
  | 'led_screen'
  | 'stage_light'
  | 'par_light'
  | 'microphone'
  | 'drum_kit'
  | 'guitar_amp'
  | 'monitor_speaker'
  | 'stage_platform'
  | 'barrier'
  | 'tent'

interface RealDessStageKitProps {
  onSelectItem?: (itemId: StageItemId) => void
  selectedItem?: string | null
}

export function RealDessStageKit({ onSelectItem, selectedItem }: RealDessStageKitProps) {
  const hoveredMesh = useAppStore((s) => s.hoveredMesh)
  const setHoveredMesh = useAppStore((s) => s.setHoveredMesh)
  const audioPulse = useAppStore((s) => s.audioPulse)
  const isPlaying = useAppStore((s) => s.isPlaying)

  const sunsetTexture = useMemo(() => createSunsetSkylineTexture(), [])
  const lightGroupRef = useRef<THREE.Group>(null!)

  // Spotlights pulse gently with music
  useFrame(({ clock }) => {
    if (lightGroupRef.current) {
      const time = clock.getElapsedTime()
      const pulse = isPlaying ? 0.85 + Math.sin(time * 8) * 0.15 + (audioPulse || 0) * 0.3 : 1.0
      lightGroupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.SpotLight) {
          child.intensity = 2.5 * pulse * (0.8 + 0.4 * Math.sin(time * 3 + i))
        }
      })
    }
  })

  const getHighlightColor = (id: StageItemId) => {
    if (selectedItem === id) return '#f59e0b' // gold
    if (hoveredMesh === id) return '#38bdf8' // cyan
    return null
  }

  const handlePointerOver = (e: any, id: StageItemId) => {
    e.stopPropagation()
    setHoveredMesh(id)
  }

  const handlePointerOut = (e: any) => {
    e.stopPropagation()
    setHoveredMesh(null)
  }

  const handleClick = (e: any, id: StageItemId) => {
    e.stopPropagation()
    onSelectItem?.(id)
  }

  return (
    <group name="REAL_DESS_STAGE_ROOT">
      {/* ========================================================
          1. STAGE PLATFORM & ACCESS STAIRS
          ======================================================== */}
      <group
        name="stage_platform"
        onClick={(e) => handleClick(e, 'stage_platform')}
        onPointerOver={(e) => handlePointerOver(e, 'stage_platform')}
        onPointerOut={handlePointerOut}
      >
        {/* Main Stage Deck */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[14, 0.9, 7.5]} />
          <meshStandardMaterial
            color={getHighlightColor('stage_platform') || '#18181b'}
            roughness={0.4}
            metalness={0.6}
          />
        </mesh>

        {/* Stage Non-Slip Flooring Surface */}
        <mesh position={[0, 0.905, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[13.8, 7.3]} />
          <meshStandardMaterial
            color={getHighlightColor('stage_platform') || '#09090b'}
            roughness={0.7}
            metalness={0.2}
          />
        </mesh>


        {/* Front Access Stairs */}
        <group position={[0, 0, 4.05]}>
          {[0, 1, 2].map((step) => (
            <mesh
              key={`stair-${step}`}
              position={[0, 0.15 + step * 0.3, -step * 0.35]}
              receiveShadow
              castShadow
            >
              <boxGeometry args={[2.8, 0.3, 0.4]} />
              <meshStandardMaterial color="#27272a" roughness={0.5} metalness={0.5} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ========================================================
          2. ALUMINUM TRUSS SYSTEM (LEFT, RIGHT, TOP, ROOF)
          ======================================================== */}
      {/* Truss Left Tower */}
      <group
        name="truss_left"
        position={[-6.8, 0, 0]}
        onClick={(e) => handleClick(e, 'truss_left')}
        onPointerOver={(e) => handlePointerOver(e, 'truss_left')}
        onPointerOut={handlePointerOut}
      >
        {/* Baseplate */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[1.2, 0.1, 1.2]} />
          <meshStandardMaterial color="#3f3f46" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* 4 Chords (Vertical Aluminum Tubes) */}
        {[-0.35, 0.35].map((x) =>
          [-0.35, 0.35].map((z) => (
            <mesh key={`tl-tube-${x}-${z}`} position={[x, 3.8, z]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 7.6, 12]} />
              <meshStandardMaterial
                color={getHighlightColor('truss_left') || '#d4d4d8'}
                metalness={0.95}
                roughness={0.25}
              />
            </mesh>
          ))
        )}
        {/* Cross Bracing Lattices */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`tl-brace-${i}`} position={[0, 0.6 + i * 0.6, 0]}>
            <boxGeometry args={[0.7, 0.03, 0.7]} />
            <meshStandardMaterial
              color={getHighlightColor('truss_left') || '#a1a1aa'}
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* Truss Right Tower */}
      <group
        name="truss_right"
        position={[6.8, 0, 0]}
        onClick={(e) => handleClick(e, 'truss_right')}
        onPointerOver={(e) => handlePointerOver(e, 'truss_right')}
        onPointerOut={handlePointerOut}
      >
        {/* Baseplate */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[1.2, 0.1, 1.2]} />
          <meshStandardMaterial color="#3f3f46" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* 4 Chords */}
        {[-0.35, 0.35].map((x) =>
          [-0.35, 0.35].map((z) => (
            <mesh key={`tr-tube-${x}-${z}`} position={[x, 3.8, z]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 7.6, 12]} />
              <meshStandardMaterial
                color={getHighlightColor('truss_right') || '#d4d4d8'}
                metalness={0.95}
                roughness={0.25}
              />
            </mesh>
          ))
        )}
        {/* Cross Bracing */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`tr-brace-${i}`} position={[0, 0.6 + i * 0.6, 0]}>
            <boxGeometry args={[0.7, 0.03, 0.7]} />
            <meshStandardMaterial
              color={getHighlightColor('truss_right') || '#a1a1aa'}
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>

      {/* Top Truss & Roof Structure */}
      <group
        name="top_truss"
        position={[0, 7.4, 0]}
        onClick={(e) => handleClick(e, 'top_truss')}
        onPointerOver={(e) => handlePointerOver(e, 'top_truss')}
        onPointerOut={handlePointerOut}
      >
        {/* Horizontal Front Cross Truss */}
        <mesh position={[0, 0, 0.35]} castShadow>
          <boxGeometry args={[14.8, 0.6, 0.6]} />
          <meshStandardMaterial
            color={getHighlightColor('top_truss') || '#d4d4d8'}
            metalness={0.9}
            roughness={0.25}
            wireframe={hoveredMesh === 'top_truss'}
          />
        </mesh>
        {/* Horizontal Rear Cross Truss */}
        <mesh position={[0, 0, -3.2]} castShadow>
          <boxGeometry args={[14.8, 0.6, 0.6]} />
          <meshStandardMaterial color="#71717a" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* Roof Canopy Pitched Top */}
        <mesh position={[0, 0.45, -1.4]} receiveShadow>
          <boxGeometry args={[15.2, 0.1, 4.4]} />
          <meshStandardMaterial color="#18181b" roughness={0.8} />
        </mesh>

        {/* STAGE HEADER FASCIA: "REAL DESS STAGE" */}
        <group position={[0, 0.2, 0.72]}>
          {/* Black Banner Board */}
          <mesh receiveShadow>
            <boxGeometry args={[13.2, 1.1, 0.08]} />
            <meshStandardMaterial
              color={getHighlightColor('top_truss') || '#09090b'}
              roughness={0.5}
            />
          </mesh>
          {/* Bold White Text */}
          <Text
            position={[0, 0, 0.06]}
            fontSize={0.65}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.08}
          >
            REAL DESS STAGE
          </Text>
        </group>
      </group>

      {/* ========================================================
          3. LED SCREEN BACKDROP (NAIROBI SUNSET SKYLINE)
          ======================================================== */}
      <group
        name="led_screen"
        position={[0, 4.3, -3.3]}
        onClick={(e) => handleClick(e, 'led_screen')}
        onPointerOver={(e) => handlePointerOver(e, 'led_screen')}
        onPointerOut={handlePointerOut}
      >
        {/* Frame Bezel */}
        <mesh receiveShadow>
          <boxGeometry args={[11.8, 5.8, 0.15]} />
          <meshStandardMaterial color="#09090b" roughness={0.8} />
        </mesh>
        {/* Glowing Sunset Display Plane */}
        <mesh position={[0, 0, 0.09]}>
          <planeGeometry args={[11.5, 5.5]} />
          <meshBasicMaterial
            map={sunsetTexture}
            color={getHighlightColor('led_screen') || '#ffffff'}
          />
        </mesh>
      </group>

      {/* ========================================================
          4. CONCERT LINE-ARRAY SOUND SYSTEM
          ======================================================== */}
      {/* Left Line Array Hang */}
      <group
        name="speaker_left"
        position={[-7.6, 5.2, 0.6]}
        onClick={(e) => handleClick(e, 'speaker_left')}
        onPointerOver={(e) => handlePointerOver(e, 'speaker_left')}
        onPointerOut={handlePointerOut}
      >
        {/* Rigging Flybar */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.8, 0.1, 0.8]} />
          <meshStandardMaterial color="#27272a" metalness={0.9} />
        </mesh>
        {/* Curved Array of 6 Speaker Modules */}
        {Array.from({ length: 6 }).map((_, idx) => {
          const angle = (idx * 0.08)
          const yOff = -idx * 0.42
          const zOff = Math.sin(angle) * 0.4
          return (
            <mesh
              key={`spk-l-${idx}`}
              position={[0, yOff, zOff]}
              rotation={[angle, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.7, 0.38, 0.6]} />
              <meshStandardMaterial
                color={getHighlightColor('speaker_left') || '#18181b'}
                roughness={0.6}
                metalness={0.3}
              />
            </mesh>
          )
        })}
      </group>

      {/* Right Line Array Hang */}
      <group
        name="speaker_right"
        position={[7.6, 5.2, 0.6]}
        onClick={(e) => handleClick(e, 'speaker_right')}
        onPointerOver={(e) => handlePointerOver(e, 'speaker_right')}
        onPointerOut={handlePointerOut}
      >
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.8, 0.1, 0.8]} />
          <meshStandardMaterial color="#27272a" metalness={0.9} />
        </mesh>
        {Array.from({ length: 6 }).map((_, idx) => {
          const angle = (idx * 0.08)
          const yOff = -idx * 0.42
          const zOff = Math.sin(angle) * 0.4
          return (
            <mesh
              key={`spk-r-${idx}`}
              position={[0, yOff, zOff]}
              rotation={[angle, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.7, 0.38, 0.6]} />
              <meshStandardMaterial
                color={getHighlightColor('speaker_right') || '#18181b'}
                roughness={0.6}
                metalness={0.3}
              />
            </mesh>
          )
        })}
      </group>

      {/* ========================================================
          5. STAGE LIGHTING & PAR LIGHTS RIG
          ======================================================== */}
      <group
        ref={lightGroupRef}
        name="stage_light"
        position={[0, 7.1, 0]}
        onClick={(e) => handleClick(e, 'stage_light')}
        onPointerOver={(e) => handlePointerOver(e, 'stage_light')}
        onPointerOut={handlePointerOut}
      >
        {/* 6 Downward Warm Golden Spotlights */}
        {[-4.5, -2.7, -0.9, 0.9, 2.7, 4.5].map((xPos, idx) => {
          const spotColors = ['#f59e0b', '#fbbf24', '#f97316', '#fbbf24', '#f59e0b', '#f97316']
          return (
            <group key={`spot-fixture-${idx}`} position={[xPos, 0, 0.3]}>
              {/* Fixture Body */}
              <mesh rotation={[Math.PI / 6, 0, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.12, 0.35, 16]} />
                <meshStandardMaterial
                  color={getHighlightColor('stage_light') || '#09090b'}
                  metalness={0.8}
                />
              </mesh>
              {/* Glowing Lens */}
              <mesh position={[0, -0.15, 0.08]} rotation={[Math.PI / 6, 0, 0]}>
                <circleGeometry args={[0.16, 16]} />
                <meshBasicMaterial color={spotColors[idx]} />
              </mesh>
              {/* Target & SpotLight */}
              <spotLight
                color={spotColors[idx]}
                intensity={2.8}
                distance={15}
                angle={Math.PI / 6}
                penumbra={0.6}
                position={[0, 0, 0]}
                target-position={[xPos * 0.4, -6.2, 0]}
                castShadow
              />
            </group>
          )
        })}
      </group>

      {/* ========================================================
          6. BACKLINE INSTRUMENTS & PROPS
          ======================================================== */}
      {/* Marshall Guitar Amp Stack (Stage Left) */}
      <group
        name="guitar_amp"
        position={[-4.2, 0.9, -1.6]}
        rotation={[0, Math.PI / 12, 0]}
        onClick={(e) => handleClick(e, 'guitar_amp')}
        onPointerOver={(e) => handlePointerOver(e, 'guitar_amp')}
        onPointerOut={handlePointerOut}
      >
        {/* Bottom 4x12 Cabinet */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.84, 0.45]} />
          <meshStandardMaterial
            color={getHighlightColor('guitar_amp') || '#18181b'}
            roughness={0.7}
          />
        </mesh>
        {/* Top 4x12 Cabinet */}
        <mesh position={[0, 1.28, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.85, 0.84, 0.45]} />
          <meshStandardMaterial
            color={getHighlightColor('guitar_amp') || '#18181b'}
            roughness={0.7}
          />
        </mesh>
        {/* Amp Head with Gold Faceplate */}
        <mesh position={[0, 1.9, 0]} castShadow>
          <boxGeometry args={[0.82, 0.35, 0.4]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.9, 0.21]}>
          <planeGeometry args={[0.76, 0.12]} />
          <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Full Drum Kit (Stage Right) */}
      <group
        name="drum_kit"
        position={[4.2, 0.9, -1.4]}
        rotation={[0, -Math.PI / 8, 0]}
        onClick={(e) => handleClick(e, 'drum_kit')}
        onPointerOver={(e) => handlePointerOver(e, 'drum_kit')}
        onPointerOut={handlePointerOut}
      >
        {/* Drum Riser */}
        <mesh position={[0, 0.1, 0]} receiveShadow>
          <boxGeometry args={[2.6, 0.2, 2.4]} />
          <meshStandardMaterial color="#27272a" roughness={0.6} />
        </mesh>

        {/* Bass Drum (Kick) */}
        <group position={[0, 0.65, 0.3]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.42, 0.55, 24]} />
            <meshStandardMaterial
              color={getHighlightColor('drum_kit') || '#991b1b'}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0, 0.28]}>
            <circleGeometry args={[0.4, 24]} />
            <meshStandardMaterial color="#ffffff" roughness={0.8} />
          </mesh>
        </group>

        {/* Snare Drum */}
        <group position={[-0.5, 0.75, 0.4]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.16, 20]} />
            <meshStandardMaterial color="#d4d4d8" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.4, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.65, 12]} />
            <meshStandardMaterial color="#71717a" metalness={0.9} />
          </mesh>
        </group>

        {/* Rack Toms */}
        <mesh position={[-0.25, 1.18, 0.25]} rotation={[0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 18]} />
          <meshStandardMaterial color="#991b1b" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.25, 1.18, 0.25]} rotation={[0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.22, 18]} />
          <meshStandardMaterial color="#991b1b" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Floor Tom */}
        <mesh position={[0.6, 0.7, 0.35]} castShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.35, 20]} />
          <meshStandardMaterial color="#991b1b" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* Cymbals (Gold Brass) */}
        <group position={[-0.85, 0.95, 0.4]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.02, 20]} />
            <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.45, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.9, 12]} />
            <meshStandardMaterial color="#71717a" metalness={0.9} />
          </mesh>
        </group>
        <group position={[-0.6, 1.5, 0.1]} rotation={[0.15, 0, 0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.015, 24]} />
            <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 1.3, 12]} />
            <meshStandardMaterial color="#71717a" metalness={0.9} />
          </mesh>
        </group>
        <group position={[0.75, 1.45, 0.1]} rotation={[0.15, 0, -0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.34, 0.34, 0.015, 24]} />
            <meshStandardMaterial color="#eab308" metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.65, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 1.3, 12]} />
            <meshStandardMaterial color="#71717a" metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Center Vocal Microphone on Stand */}
      <group
        name="microphone"
        position={[0, 0.9, 1.2]}
        onClick={(e) => handleClick(e, 'microphone')}
        onPointerOver={(e) => handlePointerOver(e, 'microphone')}
        onPointerOut={handlePointerOut}
      >
        {/* Base */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.04, 24]} />
          <meshStandardMaterial
            color={getHighlightColor('microphone') || '#27272a'}
            metalness={0.9}
          />
        </mesh>
        {/* Shaft */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 1.4, 16]} />
          <meshStandardMaterial color="#d4d4d8" metalness={0.98} roughness={0.1} />
        </mesh>
        {/* Mic Clip & Grille */}
        <group position={[0, 1.45, 0.08]} rotation={[-0.3, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.02, 0.016, 0.14, 16]} />
            <meshStandardMaterial color="#18181b" metalness={0.6} />
          </mesh>
          <mesh position={[0, 0.08, 0]} castShadow>
            <sphereGeometry args={[0.032, 16, 16]} />
            <meshStandardMaterial color="#e4e4e7" metalness={0.95} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* Stage Floor Wedge Monitor Speakers */}
      {[-2.2, 2.2].map((xPos, idx) => (
        <group
          key={`monitor-${idx}`}
          name="monitor_speaker"
          position={[xPos, 0.9, 2.4]}
          rotation={[0.35, idx === 0 ? 0.3 : -0.3, 0]}
          onClick={(e) => handleClick(e, 'monitor_speaker')}
          onPointerOver={(e) => handlePointerOver(e, 'monitor_speaker')}
          onPointerOut={handlePointerOut}
        >
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.65, 0.35, 0.45]} />
            <meshStandardMaterial
              color={getHighlightColor('monitor_speaker') || '#18181b'}
              roughness={0.8}
            />
          </mesh>
          <mesh position={[0, 0.05, 0.23]}>
            <planeGeometry args={[0.58, 0.28]} />
            <meshStandardMaterial color="#27272a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ========================================================
          7. AUDIENCE PERIMETER: CROWD CONTROL BARRIERS
          ======================================================== */}
      <group
        name="barrier"
        onClick={(e) => handleClick(e, 'barrier')}
        onPointerOver={(e) => handlePointerOver(e, 'barrier')}
        onPointerOut={handlePointerOut}
      >
        {[-5.5, -3.5, 3.5, 5.5].map((xPos, i) => (
          <group key={`front-barr-${i}`} position={[xPos, 0, 4.8]}>
            <mesh position={[0, 0.55, 0]} castShadow>
              <boxGeometry args={[1.85, 1.1, 0.06]} />
              <meshStandardMaterial
                color={getHighlightColor('barrier') || '#a1a1aa'}
                metalness={0.95}
                roughness={0.25}
                wireframe={true}
              />
            </mesh>
          </group>
        ))}

        {[-1.2, 1.2].map((xPos, sideIdx) =>
          [5.8, 7.8, 9.8].map((zPos, zIdx) => (
            <group key={`aisle-${sideIdx}-${zIdx}`} position={[xPos, 0, zPos]} rotation={[0, Math.PI / 2, 0]}>
              <mesh position={[0, 0.55, 0]} castShadow>
                <boxGeometry args={[1.85, 1.1, 0.06]} />
                <meshStandardMaterial
                  color={getHighlightColor('barrier') || '#a1a1aa'}
                  metalness={0.95}
                  roughness={0.25}
                  wireframe={true}
                />
              </mesh>
            </group>
          ))
        )}
      </group>

      {/* ========================================================
          8. WHITE PRODUCTION & VIP CANOPY TENTS
          ======================================================== */}
      <group
        name="tent"
        onClick={(e) => handleClick(e, 'tent')}
        onPointerOver={(e) => handlePointerOver(e, 'tent')}
        onPointerOut={handlePointerOut}
      >
        {/* Left Side Tents */}
        {[-12.5].map((xPos) =>
          [0, 5].map((zPos, tIdx) => (
            <group key={`tent-l-${tIdx}`} position={[xPos, 0, zPos]}>
              <mesh position={[0, 2.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
                <coneGeometry args={[2.5, 1.4, 4]} />
                <meshStandardMaterial
                  color={getHighlightColor('tent') || '#f4f4f5'}
                  roughness={0.7}
                />
              </mesh>
              {[-1.4, 1.4].map((px) =>
                [-1.4, 1.4].map((pz) => (
                  <mesh key={`tent-l-pole-${px}-${pz}`} position={[px, 0.85, pz]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 1.7, 8]} />
                    <meshStandardMaterial color="#e4e4e7" metalness={0.8} />
                  </mesh>
                ))
              )}
            </group>
          ))
        )}

        {/* Right Side Tents */}
        {[12.5].map((xPos) =>
          [0, 5].map((zPos, tIdx) => (
            <group key={`tent-r-${tIdx}`} position={[xPos, 0, zPos]}>
              <mesh position={[0, 2.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
                <coneGeometry args={[2.5, 1.4, 4]} />
                <meshStandardMaterial
                  color={getHighlightColor('tent') || '#f4f4f5'}
                  roughness={0.7}
                />
              </mesh>
              {[-1.4, 1.4].map((px) =>
                [-1.4, 1.4].map((pz) => (
                  <mesh key={`tent-r-pole-${px}-${pz}`} position={[px, 0.85, pz]} castShadow>
                    <cylinderGeometry args={[0.03, 0.03, 1.7, 8]} />
                    <meshStandardMaterial color="#e4e4e7" metalness={0.8} />
                  </mesh>
                ))
              )}
            </group>
          ))
        )}

      </group>

      {/* ========================================================
          9. VENUE LAWN & AISLE GROUND
          ======================================================== */}
      <mesh position={[0, -0.01, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial color="#0f291e" roughness={0.9} metalness={0.05} />
      </mesh>

      <mesh position={[0, 0.005, 8.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.2, 10]} />
        <meshStandardMaterial color="#27272a" roughness={0.8} metalness={0.2} />
      </mesh>
    </group>
  )
}
