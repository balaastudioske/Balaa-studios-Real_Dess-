'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { ConcertStage } from './ConcertStage'
import { StudioLighting } from './StudioLighting'
import { ArtistAvatar, ArtistAvatarRef } from './ArtistAvatar'
import { StageViewportCamera } from './StageViewportCamera'
import { HandCalibrationHUD } from './HandCalibrationHUD'
import { BalaaPhysicalSet } from './BalaaPhysicalSet'
import { StageMediaWall } from './StageMediaWall'
import { StageAtmosphereEnclosure } from './StageAtmosphereEnclosure'
import { SpaceStageEnvironment, EARTH_POSITION } from './SpaceStageEnvironment'
import { ToonMaterialProvider } from './ToonMaterialProvider'
import { NPRPostProcessing } from './NPRPostProcessing'
import { WARDROBE_LOOKS } from '@/components/ui/SpatialWardrobeShowroom'
import { HandPosePreset } from '@/lib/fingerRig'
import { useAppStore } from '@/store/useAppStore'

import React, { Suspense, useRef, useEffect, useState, useCallback, useMemo } from 'react'
import * as THREE from 'three'
import type { BalaaStageMode } from '@/lib/balaa-catalog'

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMessage: error?.message || 'WebGL Context Lost' }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('[StageViewport] WebGL Context Error caught by boundary:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-white p-6 z-50">
          <div className="max-w-md text-center bg-zinc-900/90 border border-amber-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-4 text-2xl font-bold">
              ⚡
            </div>
            <h3 className="text-lg font-black tracking-wide text-white uppercase mb-2">
              Graphics Context Reset
            </h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Your browser graphics context was reset. Click below to reconnect the 3D performance stage.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' })
                if (typeof window !== 'undefined') window.location.reload()
              }}
              className="px-6 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider transition-all shadow-lg hover:scale-105"
            >
              Reconnect 3D Stage
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function StageMoveSurface() {
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setFreeRoamTarget = useAppStore((state) => state.setFreeRoamTarget)

  return (
    <mesh
      name="STAGE_WALK_CLICK_SURFACE"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.012, 0]}
      onPointerOver={() => {
        if (!isPlaying) document.body.style.cursor = 'crosshair'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
      onClick={(event) => {
        event.stopPropagation()
        // Ignore camera drag operations (only genuine tap/click)
        if (event.delta > 5 || isPlaying) return

        // Transform click from deep-space orbital world coordinates into local stage space
        const local = event.object.parent
          ? event.object.parent.worldToLocal(event.point.clone())
          : event.point

        const clampedX = THREE.MathUtils.clamp(local.x, -2.5, 2.5)
        const clampedZ = THREE.MathUtils.clamp(local.z, -1.1, 1.1)

        setFreeRoamTarget([clampedX, 0, clampedZ])
      }}
    >
      <planeGeometry args={[6.8, 3.2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

// 4 Symmetrical Metallic Rocket Thrusters Mounted Behind the Stage Rear Underside
function StageOrbitalRocketThrusters() {
  const isPlaying = useAppStore((s) => s.isPlaying)
  const audioPulse = useAppStore((s) => s.audioPulse)
  const cameraMode = useAppStore((s) => s.cameraMode)

  const thrustersGroupRef = useRef<THREE.Group>(null!)
  const particlePointsRef = useRef<THREE.Points>(null!)

  const thrusterMounts = useMemo(
    () => [
      new THREE.Vector3(-4.8, -0.68, -3.65),
      new THREE.Vector3(-1.6, -0.68, -3.65),
      new THREE.Vector3(1.6, -0.68, -3.65),
      new THREE.Vector3(4.8, -0.68, -3.65),
    ],
    []
  )

  const { particlePositions, particleLifetimes, particleVelocities } = useMemo(() => {
    const numParticles = 16 * 4
    const positions = new Float32Array(numParticles * 3)
    const lifetimes = new Float32Array(numParticles)
    const velocities = new Float32Array(numParticles * 3)

    for (let t = 0; t < 4; t++) {
      const mount = thrusterMounts[t]
      for (let p = 0; p < 16; p++) {
        const idx = t * 16 + p
        positions[idx * 3] = mount.x + (Math.random() - 0.5) * 0.16
        positions[idx * 3 + 1] = mount.y + (Math.random() - 0.5) * 0.10
        positions[idx * 3 + 2] = mount.z - 0.4 - Math.random() * 2.5
        lifetimes[idx] = Math.random()
        velocities[idx * 3] = (Math.random() - 0.5) * 0.10
        velocities[idx * 3 + 1] = (Math.random() - 0.5) * 0.10
        velocities[idx * 3 + 2] = -2.6 - Math.random() * 3.0
      }
    }
    return { particlePositions: positions, particleLifetimes: lifetimes, particleVelocities: velocities }
  }, [thrusterMounts])

  const particleTex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255, 255, 230, 1.0)') // Hot white core
    grad.addColorStop(0.35, 'rgba(255, 165, 25, 0.9)') // Golden orange
    grad.addColorStop(0.75, 'rgba(225, 55, 10, 0.4)') // Fiery amber
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime()
    const pulse = isPlaying ? (audioPulse || 0) : 0
    const isMoving = cameraMode === 'explore' || isPlaying

    if (particlePointsRef.current) {
      const posAttr = particlePointsRef.current.geometry.attributes.position as THREE.BufferAttribute
      const posArray = posAttr.array as Float32Array
      const speedMultiplier = isMoving ? 1.65 + pulse * 0.9 : 0.9

      for (let t = 0; t < 4; t++) {
        const mount = thrusterMounts[t]
        for (let p = 0; p < 16; p++) {
          const idx = t * 16 + p
          let life = particleLifetimes[idx] + delta * (0.9 * speedMultiplier)

          if (life >= 1.0) {
            life = 0
            posArray[idx * 3] = mount.x + (Math.random() - 0.5) * 0.16
            posArray[idx * 3 + 1] = mount.y + (Math.random() - 0.5) * 0.10
            posArray[idx * 3 + 2] = mount.z - 0.4
          } else {
            posArray[idx * 3] += particleVelocities[idx * 3] * delta
            posArray[idx * 3 + 1] += particleVelocities[idx * 3 + 1] * delta
            posArray[idx * 3 + 2] += particleVelocities[idx * 3 + 2] * delta * speedMultiplier
          }
          particleLifetimes[idx] = life
        }
      }
      posAttr.needsUpdate = true
    }

    if (thrustersGroupRef.current) {
      const radiusScale = 1.0 + pulse * 0.18 + Math.sin(time * 14) * 0.05
      const lengthScale = 1.0 + (isMoving ? 0.55 : 0.0) + pulse * 0.5
      thrustersGroupRef.current.children.forEach((child) => {
        const flame = child.getObjectByName('FLAME_CONE')
        if (flame) {
          flame.scale.set(radiusScale, radiusScale, lengthScale)
        }
      })
    }
  })

  return (
    <group name="STAGE_METALLIC_THRUSTERS">
      <group ref={thrustersGroupRef}>
        {thrusterMounts.map((mount, i) => (
          <group key={i} position={mount}>
            {/* Dark Metallic Titanium Chrome Nozzle Housing */}
            <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.26, 0.14, 0.55, 12]} />
              <meshStandardMaterial
                color="#181a20"
                metalness={0.92}
                roughness={0.2}
              />
            </mesh>

            {/* Inner Metallic Ring Trim */}
            <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.22, 0.028, 8, 16]} />
              <meshStandardMaterial
                color="#64748b"
                metalness={0.88}
                roughness={0.25}
              />
            </mesh>

            {/* Fiery Exhaust Flame Cone */}
            <mesh name="FLAME_CONE" position={[0, 0, -0.72]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.03, 0.85, 10, 1, true]} />
              <meshBasicMaterial
                color="#f97316"
                transparent={true}
                opacity={0.92}
                blending={THREE.AdditiveBlending}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      <points ref={particlePointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={particleTex}
          size={0.7}
          transparent={true}
          opacity={0.88}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>

      <pointLight position={[0, -0.85, -2.8]} color="#ea580c" intensity={3.4} distance={7} />
    </group>
  )
}

/**
 * Satellite Orbital Stage Rig:
 * The stage physically orbits Earth along a 3D orbital trajectory.
 *
 * Orientation rules:
 *   - The stage's local +Z axis is "forward" (nose / front of stage).
 *   - The stage's local -Z axis is "rear" (where the 4 rocket thrusters are).
 *   - The stage heading always aligns with its tangential orbital velocity
 *     so the nose points in the direction of travel and thrusters fire rearward.
 *   - Earth remains on the stage's RIGHT side (local +X) throughout the orbit.
 *
 * Camera and OrbitControls track with the moving stage seamlessly.
 */

// Pre-allocated vectors to avoid per-frame allocation
const _stagePos = new THREE.Vector3()
const _tangent = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _lookTarget = new THREE.Vector3()
const _toEarth = new THREE.Vector3()
const _mat4 = new THREE.Matrix4()
const SatelliteOrbitalStageRig = React.forwardRef<
  THREE.Group,
  { children: React.ReactNode }
>(({ children }, ref) => {
  useFrame((_, delta) => {
    if (ref && 'current' in ref && ref.current) {
      // Continuous, slow, subtle, atmospheric orbital motion (slow: 0.008 rad/s)
      ref.current.rotation.y += delta * 0.008
    }
  })

  return (
    <group ref={ref} name="BALAA_ZERO_GRAVITY_STAGE_RIG" position={[0, 0, 0]}>
      {children}
      <StageOrbitalRocketThrusters />
    </group>
  )
})

SatelliteOrbitalStageRig.displayName = 'SatelliteOrbitalStageRig'

interface StageViewportProps {
  className?: string
  conceptMode?: boolean
  activeMode?: BalaaStageMode
  onSetMode?: (mode: BalaaStageMode) => void
}

type CameraPresetKey = 'stage' | 'avatar' | 'left-hand' | 'right-hand' | 'full-body-front'

const CAMERA_PRESETS: Record<
  CameraPresetKey,
  { pos: [number, number, number]; target: [number, number, number]; label: string }
> = {
  stage: { pos: [0, 2.2, 5.8], target: [0, 1.2, 0], label: 'Stage Full' },
  'full-body-front': { pos: [0, 1.1, 3.2], target: [0, 1.0, 0], label: 'Front Fashion (Ref 2/3)' },
  avatar: { pos: [0, 1.55, 1.4], target: [0, 1.50, 0], label: 'Face / Bust' },
  'left-hand': { pos: [0.75, 1.42, 0.45], target: [0.75, 1.42, 0.05], label: 'Left Hand' },
  'right-hand': { pos: [-0.75, 1.42, 0.45], target: [-0.75, 1.42, 0.05], label: 'Right Hand' },
}

const ALL_HAND_POSES: { key: HandPosePreset; label: string }[] = [
  { key: 'relaxed', label: '1. Relaxed' },
  { key: 'neutral', label: '2. Neutral T-Pose' },
  { key: 'open', label: '3. Open Hand' },
  { key: 'fist', label: '4. Fist' },
  { key: 'point', label: '5. Point' },
  { key: 'spread', label: '6. Spread Fingers' },
  { key: 'thumb-oppose', label: '7. Thumb Oppose' },
  { key: 'mic-grip', label: '8. Mic Grip' },
  { key: 'performance-fast', label: '9. Fast Gesture' },
  { key: 'performance-slow', label: '10. Slow Flow' },
]

export const StageViewport = ({ className = '', conceptMode = false, activeMode = 'catalog', onSetMode }: StageViewportProps) => {
  const avatarGroupRef = useRef<ArtistAvatarRef>(null)
  const controlsRef = useRef<any>(null)
  const stageRigRef = useRef<THREE.Group>(null)
  const [canRender, setCanRender] = useState(false)

  const [activePose, setActivePose] = useState<HandPosePreset>('relaxed')
  const [activeCamKey, setActiveCamKey] = useState<CameraPresetKey>('full-body-front')
  const avatarModel = '/assets/models/dess.glb'
  const [whiteStudio, setWhiteStudio] = useState<boolean>(false)
  const [showCalibrationHUD, setShowCalibrationHUD] = useState(false)

  const currentOutfit = useAppStore((s) => s.currentOutfit)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const wardrobeLook = WARDROBE_LOOKS.find((look) => look.id === currentOutfit) || WARDROBE_LOOKS[0]
  const wardrobeIndex = Math.max(0, WARDROBE_LOOKS.findIndex((look) => look.id === wardrobeLook.id))

  useEffect(() => {
    if (typeof window === 'undefined') return
    const timer = setTimeout(() => setCanRender(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleCreated = useCallback((state: any) => {
    const canvas = state.gl?.domElement as HTMLCanvasElement | undefined
    if (!canvas) return

    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault()
        console.warn('[StageViewport] WebGL context lost; preserving state.')
      },
      { once: true }
    )

    state.gl.setClearColor(whiteStudio ? '#ffffff' : '#09090b', 1)
  }, [whiteStudio])

  const setCameraPreset = (key: CameraPresetKey) => {
    setActiveCamKey(key)
    const preset = CAMERA_PRESETS[key]
    if (controlsRef.current && controlsRef.current.object) {
      controlsRef.current.object.position.set(preset.pos[0], preset.pos[1], preset.pos[2])
      controlsRef.current.target.set(preset.target[0], preset.target[1], preset.target[2])
      controlsRef.current.update()
    }
  }

  if (!canRender) {
    return (
      <div className={`h-full w-full bg-neutral-950 flex items-center justify-center text-neutral-500 font-mono text-xs ${className}`}>
        Initializing Master Artist Fashion Studio...
      </div>
    )
  }

  return (
    <div className="relative h-full w-full select-none">
      {/* Concept Mode Diagnostic Panel */}
      {conceptMode && (
        <div className="absolute top-4 left-4 z-40 bg-black/85 backdrop-blur-md border border-slate-700/70 rounded-xl p-3.5 font-mono text-xs text-slate-200 shadow-2xl space-y-3 max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                BALAA STUDIOS — ARTIST RIG
              </div>
              <div className="text-[10px] text-slate-400">73-Bone Symmetrical Rig</div>
            </div>
            <button
              onClick={() => setShowCalibrationHUD(!showCalibrationHUD)}
              className={`px-2 py-1 text-[10px] rounded border transition-all ${
                showCalibrationHUD
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {showCalibrationHUD ? 'Hide Metrics' : 'Audit'}
            </button>
          </div>

          {/* Camera View Switcher */}
          <div>
            <div className="text-[10px] uppercase text-slate-400 font-semibold mb-1.5 flex justify-between items-center">
              <span>Camera Framing</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(CAMERA_PRESETS) as CameraPresetKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setCameraPreset(key)}
                  className={`px-2 py-1 text-[10.5px] rounded transition-all text-left truncate ${
                    activeCamKey === key
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-semibold'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  {CAMERA_PRESETS[key].label}
                </button>
              ))}
            </div>
          </div>

          {/* 10 Anatomical Poses */}
          <div>
            <div className="text-[10px] uppercase text-cyan-400 font-semibold mb-1.5 flex justify-between items-center">
              <span>10 Anatomical Poses</span>
              <span className="text-slate-500 text-[9px]">Spring Physics</span>
            </div>
            <div className="grid grid-cols-2 gap-1 max-h-44 overflow-y-auto pr-0.5">
              {ALL_HAND_POSES.map((pose) => (
                <button
                  key={pose.key}
                  onClick={() => setActivePose(pose.key)}
                  className={`px-2 py-1 text-[10.5px] rounded transition-all text-left truncate ${
                    activePose === pose.key
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/60 font-semibold shadow-sm'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  {pose.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hand Calibration & Measurement Tool */}
      {showCalibrationHUD && (
        <div className="absolute bottom-20 right-6 z-50">
          <HandCalibrationHUD onClose={() => setShowCalibrationHUD(false)} />
        </div>
      )}

      {/* 3D Canvas with WebGL Resilience Boundary */}
      <WebGLErrorBoundary>
        <Canvas
          camera={{ fov: 46, near: 0.1, far: 30000, position: [0, 2.3, 7.8] }}
          dpr={[1, 1.5]}
          shadows="basic"
          frameloop="always"
          gl={{
            antialias: true,
            alpha: true,
            depth: true,
            stencil: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
          }}
          className={className}
          onCreated={handleCreated}
        >
          {/* Scene-wide Toon Materials & NPR Post-Processing */}
          <ToonMaterialProvider />
          <NPRPostProcessing />

          {/* Dynamic Background Color */}
          <color attach="background" args={[whiteStudio ? '#ffffff' : '#09090b']} />

          {/* Studio Lighting System */}
          <StudioLighting conceptMode={conceptMode} whiteStudio={whiteStudio} />

          {/* Space Stage Cosmos Environment */}
          {!whiteStudio && (
            <Suspense fallback={null}>
              <SpaceStageEnvironment />
            </Suspense>
          )}

          {/* Satellite Stage Rig (Anchored stably at origin, subtle continuous orbital rotation) */}
          <SatelliteOrbitalStageRig ref={stageRigRef}>
            {!whiteStudio && <ConcertStage conceptMode={conceptMode} />}
            {!whiteStudio && <StageAtmosphereEnclosure />}
            {!whiteStudio && <Suspense fallback={null}><BalaaPhysicalSet onNavigate={onSetMode} /></Suspense>}
            {!whiteStudio && <Suspense fallback={null}><StageMediaWall /></Suspense>}
            <Suspense fallback={
              <group position={[0, 0.9, 0]}>
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.22, 0.22, 1.75, 16]} />
                  <meshBasicMaterial color="#f97316" wireframe transparent opacity={0.35} />
                </mesh>
                <pointLight position={[0, 0.5, 0]} color="#f97316" intensity={1.5} distance={3} />
              </group>
            }>
              <ArtistAvatar ref={avatarGroupRef} modelUrl={avatarModel} conceptMode={conceptMode} position={[0, 0, 0]} handPose={activePose} />
            </Suspense>
            {!whiteStudio && activeMode !== 'wardrobe' && <StageMoveSurface />}
          </SatelliteOrbitalStageRig>

          {/* Single Authoritative Cinematic Camera Controller (Front-locked to stage in Artist Mode) */}
          <StageViewportCamera controlsRef={controlsRef} stageRigRef={stageRigRef} />

          {/* Orbit Camera Controls with Smooth Mouse Feel in Explore Mode */}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={[0, 1.1, 0]}
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.48}
            zoomSpeed={0.55}
            enableZoom={cameraMode === 'explore'}
            enablePan={cameraMode === 'explore'}
            enableRotate={cameraMode === 'explore'}
            enabled={cameraMode === 'explore'}
            minDistance={2.2}
            maxDistance={2400}
            minPolarAngle={0.05}
            maxPolarAngle={Math.PI - 0.05}
          />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  )
}
