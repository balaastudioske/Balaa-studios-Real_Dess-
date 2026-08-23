'use client'

/**
 * BALAA STUDIOS — Cartoonistic Solar System & Symmetrical 3D Model Glow
 *
 * 1. Clean Symmetrical 3D Atmospheric Glow:
 *    - Glow wraps the complete 3D sphere shape of Earth and planets concentrically and symmetrically.
 *    - Smooth Fresnel limb emission tight to the planetary surface.
 * 2. Cartoonistic Sun & Solar Furnace:
 *    - Dynamic cartoon solar furnace corona and convective flares.
 * 3. True Shader-Based Actively Twinkling Starfield:
 *    - 2,400 diamond-bright stars with procedural twinkling vertex/fragment shader.
 * 4. Universal Cosmic Motion:
 *    - Deep space dust drifts and shooting stars.
 * 5. 8 Grand Cartoon Cel-Shaded Planets:
 *    - Scaled proportional sizes with Saturn's glowing ring disc.
 */

import { useRef, useMemo, useEffect, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useTexture, Billboard } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'

// ─── ASTRONOMICAL ANCHORS & CONSTANTS ─────────────────────────────────────────
const NUM_TWINKLE_STARS = 1200
const NUM_COSMIC_DUST = 200
const NUM_SHOOTING_STARS = 3

// Central Sun coordinates in deep celestial space
export const SUN_POSITION = new THREE.Vector3(-1200, 450, -2600)

// Earth Fixed Celestial Position
export const EARTH_POSITION = new THREE.Vector3(160, -30, -50)

// ─── 1. REAL SHADER-BASED ACTIVELY TWINKLING STARFIELD ───────────────────────
const starVertexShader = `
  attribute float aSize;
  attribute float aFreq;
  attribute float aPhase;
  attribute vec3 aColor;
  
  uniform float uTime;
  
  varying vec3 vColor;
  varying float vTwinkle;
  
  void main() {
    vColor = aColor;
    
    // Dynamic sinusoidal twinkling calculation
    float wave = sin(uTime * aFreq + aPhase);
    vTwinkle = 0.25 + 0.95 * (wave * wave * wave * wave);
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * vTwinkle * (450.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying vec3 vColor;
  varying float vTwinkle;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    // Procedural diamond 4-point star flare
    float crossFlare = max(
      1.0 - abs(coord.x) * 6.0,
      1.0 - abs(coord.y) * 6.0
    );
    crossFlare = clamp(crossFlare, 0.0, 1.0);
    
    float core = 1.0 - smoothstep(0.0, 0.5, dist);
    float alpha = clamp(core + crossFlare * 0.45, 0.0, 1.0) * vTwinkle;
    
    vec3 finalColor = vColor * (1.2 + vTwinkle * 1.8);
    gl_FragColor = vec4(finalColor, alpha);
  }
`

function TrueTwinklingShaderStarfield() {
  const pointsRef = useRef<THREE.Points>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { camera } = useThree()

  const { positions, sizes, freqs, phases, colors } = useMemo(() => {
    const pos = new Float32Array(NUM_TWINKLE_STARS * 3)
    const sz = new Float32Array(NUM_TWINKLE_STARS)
    const fr = new Float32Array(NUM_TWINKLE_STARS)
    const ph = new Float32Array(NUM_TWINKLE_STARS)
    const col = new Float32Array(NUM_TWINKLE_STARS * 3)

    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#93c5fd'),
      new THREE.Color('#fef08a'),
      new THREE.Color('#fed7aa'),
      new THREE.Color('#e0e7ff'),
      new THREE.Color('#67e8f9'),
    ]

    for (let i = 0; i < NUM_TWINKLE_STARS; i++) {
      const radius = 3500 + Math.random() * 8500
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)

      sz[i] = 18.0 + Math.random() * 30.0
      fr[i] = 1.8 + Math.random() * 5.5
      ph[i] = Math.random() * Math.PI * 2

      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }

    return { positions: pos, sizes: sz, freqs: fr, phases: ph, colors: col }
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  )

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time
    }

    if (pointsRef.current) {
      pointsRef.current.position.copy(camera.position)
      pointsRef.current.rotation.y = time * 0.0015
      pointsRef.current.rotation.x = Math.sin(time * 0.001) * 0.012
    }
  })

  return (
    <points ref={pointsRef} name="TRUE_TWINKLING_STARFIELD">
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aFreq" args={[freqs, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </points>
  )
}

// ─── 2. UNIVERSAL COSMIC MOTION: DEEP SPACE DUST & SHOOTING STARS ─────────────
function UniversalCosmicMotion() {
  const dustPointsRef = useRef<THREE.Points>(null!)
  const meteorsLinesRef = useRef<THREE.LineSegments>(null!)

  const isPlaying = useAppStore((s) => s.isPlaying)
  const audioPulse = useAppStore((s) => s.audioPulse)

  const { dustPositions, dustVelocities } = useMemo(() => {
    const pos = new Float32Array(NUM_COSMIC_DUST * 3)
    const vel = new Float32Array(NUM_COSMIC_DUST * 3)

    for (let i = 0; i < NUM_COSMIC_DUST; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2600
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1400
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3400

      vel[i * 3] = (Math.random() - 0.5) * 8
      vel[i * 3 + 1] = (Math.random() - 0.5) * 4
      vel[i * 3 + 2] = -14 - Math.random() * 26
    }
    return { dustPositions: pos, dustVelocities: vel }
  }, [])

  const { meteorPositions, meteorVelocities } = useMemo(() => {
    const pos = new Float32Array(NUM_SHOOTING_STARS * 6)
    const vel = new Float32Array(NUM_SHOOTING_STARS * 3)

    for (let i = 0; i < NUM_SHOOTING_STARS; i++) {
      const x = -600 + Math.random() * 1200
      const y = 150 + Math.random() * 600
      const z = -1200 - Math.random() * 1600

      pos[i * 6] = x
      pos[i * 6 + 1] = y
      pos[i * 6 + 2] = z
      pos[i * 6 + 3] = x + 40
      pos[i * 6 + 4] = y - 25
      pos[i * 6 + 5] = z + 60

      vel[i * 3] = 120 + Math.random() * 180
      vel[i * 3 + 1] = -75 - Math.random() * 110
      vel[i * 3 + 2] = 180 + Math.random() * 240
    }
    return { meteorPositions: pos, meteorVelocities: vel }
  }, [])

  const particleTex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
    grad.addColorStop(0.35, 'rgba(147, 197, 253, 0.85)')
    grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.25)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 32, 32)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  const lastUpdate = useRef(0)

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime()
    if (time - lastUpdate.current < 0.033) return // Cap particle array updates to 30fps to avoid main thread bottlenecks
    const dt = Math.min(delta, 0.05)
    lastUpdate.current = time

    const pulse = isPlaying ? (audioPulse || 0) : 0
    const speedBoost = 1.0 + pulse * 0.8

    if (dustPointsRef.current) {
      const posAttr = dustPointsRef.current.geometry.attributes.position as THREE.BufferAttribute
      const posArr = posAttr.array as Float32Array

      for (let i = 0; i < NUM_COSMIC_DUST; i++) {
        posArr[i * 3] += dustVelocities[i * 3] * dt * speedBoost
        posArr[i * 3 + 1] += dustVelocities[i * 3 + 1] * dt * speedBoost
        posArr[i * 3 + 2] += dustVelocities[i * 3 + 2] * dt * speedBoost

        if (posArr[i * 3 + 2] < -2000) {
          posArr[i * 3 + 2] = 1200
        }
      }
      posAttr.needsUpdate = true
    }

    if (meteorsLinesRef.current) {
      const posAttr = meteorsLinesRef.current.geometry.attributes.position as THREE.BufferAttribute
      const posArr = posAttr.array as Float32Array

      for (let i = 0; i < NUM_SHOOTING_STARS; i++) {
        const idx = i * 6
        const vx = meteorVelocities[i * 3] * dt * speedBoost
        const vy = meteorVelocities[i * 3 + 1] * dt * speedBoost
        const vz = meteorVelocities[i * 3 + 2] * dt * speedBoost

        posArr[idx] += vx
        posArr[idx + 1] += vy
        posArr[idx + 2] += vz
        posArr[idx + 3] += vx
        posArr[idx + 4] += vy
        posArr[idx + 5] += vz

        if (posArr[idx + 2] > 400 || posArr[idx + 1] < -400) {
          const rx = -600 + Math.random() * 1200
          const ry = 250 + Math.random() * 600
          const rz = -1600 - Math.random() * 1400

          posArr[idx] = rx
          posArr[idx + 1] = ry
          posArr[idx + 2] = rz
          posArr[idx + 3] = rx + 35
          posArr[idx + 4] = ry - 22
          posArr[idx + 5] = rz + 55
        }
      }
      posAttr.needsUpdate = true
    }
  })

  return (
    <group name="UNIVERSAL_COSMIC_MOTION">
      <points ref={dustPointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={particleTex}
          size={4.0}
          color="#93c5fd"
          transparent={true}
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
          sizeAttenuation={true}
        />
      </points>

      <lineSegments ref={meteorsLinesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[meteorPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#fef08a"
          transparent={true}
          opacity={0.75}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </lineSegments>
    </group>
  )
}

// ─── 3. SYMMETRICAL 3D VOLUMETRIC GLOW WRAPPING EARTH GLOBE ───────────────────
// Clean, concentric symmetrical 3D Fresnel atmospheric glow shell
const earthAtmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const earthAtmosphereFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  
  void main() {
    // Symmetrical, smooth 3D Fresnel limb glow wrapping the globe uniformly
    float VdotN = max(dot(vViewDir, vNormal), 0.0);
    float limb = pow(1.0 - VdotN, 3.5);
    
    vec3 atmosphereColor = vec3(0.35, 0.75, 1.0);
    gl_FragColor = vec4(atmosphereColor, limb * 0.60);
  }
`

function MassiveEarthSatellitePerspective() {
  const { scene } = useGLTF('/assets/models/earth-globe.glb')
  const earthGlobeRef = useRef<THREE.Group>(null!)

  const clonedScene = useMemo(() => {
    const c = clone(scene)
    c.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = true
        node.receiveShadow = true
        if (node.material) {
          node.material.fog = false
        }
      }
    })
    // Center the GLB geometry locally (GLB origin was at south pole Y=0)
    c.position.set(0, -0.485, 0)
    return c
  }, [scene])

  // Concentric symmetrical 3D atmospheric glow shader
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: earthAtmosphereVertexShader,
      fragmentShader: earthAtmosphereFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    })
  }, [])

  useFrame((_, delta) => {
    // 24-hour continuous Earth axial rotation
    if (earthGlobeRef.current) {
      earthGlobeRef.current.rotation.y += delta * 0.16
    }
  })

  return (
    <group position={[EARTH_POSITION.x, EARTH_POSITION.y, EARTH_POSITION.z]} name="MASSIVE_EARTH_ON_RIGHT">
      {/* 23.44° Physical Earth Axial Tilt */}
      <group rotation={[0, 0, THREE.MathUtils.degToRad(23.44)]}>
        {/* Massive 3D Earth Globe (scale: 160 units => radius ~80) */}
        <group ref={earthGlobeRef} scale={[160, 160, 160]}>
          <primitive object={clonedScene} />
        </group>

        {/* Clean, Concentric Symmetrical 3D Atmospheric Glow Shell (scale: 82.5 units => tightly wraps Earth) */}
        <mesh scale={[82.5, 82.5, 82.5]} material={atmosphereMaterial}>
          <sphereGeometry args={[1, 48, 36]} />
        </mesh>
      </group>
    </group>
  )
}

// ─── 4. CARTOONISTIC CENTRAL SUN ─────────────────────────────────────────────
function ColossalCentralSun() {
  const { scene: sunScene } = useGLTF('/assets/models/sun-3d-model.glb')
  const sunMeshRef = useRef<THREE.Group>(null!)
  const coronaRef = useRef<THREE.Mesh>(null!)
  const outerFlamesRef = useRef<THREE.Mesh>(null!)

  const isPlaying = useAppStore((s) => s.isPlaying)
  const audioPulse = useAppStore((s) => s.audioPulse)

  const clonedScene = useMemo(() => {
    const c = clone(sunScene)
    // Compute geometric center of sun GLB and center it precisely to (0,0,0)
    c.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(c)
    const center = new THREE.Vector3()
    box.getCenter(center)
    c.position.sub(center)

    c.traverse((node: any) => {
      if (node.isMesh && node.material) {
        node.material.fog = false
        node.material.toneMapped = false
      }
    })
    return c
  }, [sunScene])

  const { coronaTexture, furnaceTexture } = useMemo(() => {
    const c1 = document.createElement('canvas')
    c1.width = 512
    c1.height = 512
    const ctx1 = c1.getContext('2d')!
    // Symmetrical balanced concentric corona gradient
    const g1 = ctx1.createRadialGradient(256, 256, 90, 256, 256, 256)
    g1.addColorStop(0, 'rgba(255, 250, 215, 0.98)')
    g1.addColorStop(0.35, 'rgba(255, 160, 20, 0.85)')
    g1.addColorStop(0.70, 'rgba(240, 70, 10, 0.40)')
    g1.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx1.fillStyle = g1
    ctx1.fillRect(0, 0, 512, 512)
    const t1 = new THREE.CanvasTexture(c1)
    t1.needsUpdate = true

    const c2 = document.createElement('canvas')
    c2.width = 512
    c2.height = 512
    const ctx2 = c2.getContext('2d')!
    const g2 = ctx2.createRadialGradient(256, 256, 120, 256, 256, 256)
    g2.addColorStop(0, 'rgba(255, 210, 45, 0.90)')
    g2.addColorStop(0.50, 'rgba(250, 95, 15, 0.55)')
    g2.addColorStop(0.85, 'rgba(195, 35, 5, 0.20)')
    g2.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx2.fillStyle = g2
    ctx2.fillRect(0, 0, 512, 512)
    const t2 = new THREE.CanvasTexture(c2)
    t2.needsUpdate = true

    return { coronaTexture: t1, furnaceTexture: t2 }
  }, [])

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime()
    const pulse = isPlaying ? (audioPulse || 0) : 0

    if (sunMeshRef.current) {
      sunMeshRef.current.rotation.y += delta * 0.05
    }

    if (coronaRef.current) {
      const scale = 620 + Math.sin(time * 3.2) * 20 + pulse * 35
      coronaRef.current.scale.set(scale, scale, 1)
      coronaRef.current.rotation.z += delta * 0.12
    }

    if (outerFlamesRef.current) {
      const scale = 780 + Math.cos(time * 2.4) * 25 + pulse * 45
      outerFlamesRef.current.scale.set(scale, scale, 1)
      outerFlamesRef.current.rotation.z -= delta * 0.08
    }
  })

  return (
    <group
      position={[SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z]}
      name="COLOSSAL_CENTRAL_SUN"
    >
      <group ref={sunMeshRef} scale={[280, 280, 280]}>
        <primitive object={clonedScene} />
      </group>

      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh ref={coronaRef} position={[0, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={coronaTexture}
            transparent={true}
            opacity={0.92}
            fog={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>

      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh ref={outerFlamesRef} position={[0, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={furnaceTexture}
            transparent={true}
            opacity={0.75}
            fog={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
    </group>
  )
}

// ─── 5. REALISTIC 8 CARTOON CEL-SHADED PLANETS ────────────────────────────────
interface GrandPlanetConfig {
  name: string
  orbitalDistanceAU: number
  orbitalSpeed: number
  orbitalInclinationDeg: number
  angleOffset: number
  scale: number
  color: string
  roughness: number
  metalness: number
  axialTiltDeg: number
  spinSpeed: number
  hasRing?: boolean
}

const GRAND_SOLAR_PLANETS: GrandPlanetConfig[] = [
  {
    name: 'Mercury',
    orbitalDistanceAU: 480,
    orbitalSpeed: 0.16,
    orbitalInclinationDeg: 7.0,
    angleOffset: 0.6,
    scale: 14.0,
    color: '#a8a29e',
    roughness: 0.9,
    metalness: 0.1,
    axialTiltDeg: 0.03,
    spinSpeed: 0.08,
  },
  {
    name: 'Venus',
    orbitalDistanceAU: 750,
    orbitalSpeed: 0.12,
    orbitalInclinationDeg: 3.39,
    angleOffset: 2.2,
    scale: 28.0,
    color: '#fcd34d',
    roughness: 0.6,
    metalness: 0.05,
    axialTiltDeg: 177.3,
    spinSpeed: -0.05,
  },
  {
    name: 'Mars',
    orbitalDistanceAU: 1200,
    orbitalSpeed: 0.085,
    orbitalInclinationDeg: 1.85,
    angleOffset: 3.8,
    scale: 22.0,
    color: '#ea580c',
    roughness: 0.85,
    metalness: 0.15,
    axialTiltDeg: 25.19,
    spinSpeed: 0.14,
  },
  {
    name: 'Jupiter',
    orbitalDistanceAU: 1850,
    orbitalSpeed: 0.048,
    orbitalInclinationDeg: 1.31,
    angleOffset: 1.1,
    scale: 95.0,
    color: '#d97706',
    roughness: 0.5,
    metalness: 0.0,
    axialTiltDeg: 3.13,
    spinSpeed: 0.28,
  },
  {
    name: 'Saturn',
    orbitalDistanceAU: 2550,
    orbitalSpeed: 0.034,
    orbitalInclinationDeg: 2.49,
    angleOffset: 3.4,
    scale: 78.0,
    color: '#fef08a',
    roughness: 0.55,
    metalness: 0.0,
    axialTiltDeg: 26.73,
    spinSpeed: 0.24,
    hasRing: true,
  },
  {
    name: 'Uranus',
    orbitalDistanceAU: 3300,
    orbitalSpeed: 0.022,
    orbitalInclinationDeg: 0.77,
    angleOffset: 5.0,
    scale: 48.0,
    color: '#38bdf8',
    roughness: 0.45,
    metalness: 0.05,
    axialTiltDeg: 97.77,
    spinSpeed: -0.16,
  },
  {
    name: 'Neptune',
    orbitalDistanceAU: 4050,
    orbitalSpeed: 0.016,
    orbitalInclinationDeg: 1.77,
    angleOffset: 0.3,
    scale: 46.0,
    color: '#2563eb',
    roughness: 0.45,
    metalness: 0.05,
    axialTiltDeg: 28.32,
    spinSpeed: 0.18,
  },
  {
    name: 'Pluto',
    orbitalDistanceAU: 4750,
    orbitalSpeed: 0.011,
    orbitalInclinationDeg: 17.16,
    angleOffset: 2.7,
    scale: 15.0,
    color: '#cbd5e1',
    roughness: 0.95,
    metalness: 0.1,
    axialTiltDeg: 122.53,
    spinSpeed: 0.06,
  },
]

// Shared radiant celestial atmospheric glow halo texture for all planets
let _sharedPlanetGlowTexture: THREE.CanvasTexture | null = null
function getSharedPlanetGlowTexture(): THREE.CanvasTexture {
  if (!_sharedPlanetGlowTexture) {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(32, 32, 8, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
    grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.85)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)
    _sharedPlanetGlowTexture = new THREE.CanvasTexture(canvas)
    _sharedPlanetGlowTexture.needsUpdate = true
  }
  return _sharedPlanetGlowTexture
}

function GrandKeplerianPlanet({
  config,
  baseGeometry,
}: {
  config: GrandPlanetConfig
  baseGeometry: THREE.BufferGeometry
}) {
  const planetGroupRef = useRef<THREE.Group>(null!)
  const spinMeshRef = useRef<THREE.Mesh>(null!)

  const planetMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: config.roughness,
      metalness: config.metalness,
      emissive: config.color,
      emissiveIntensity: 0.18,
      fog: false,
    })
  }, [config])

  const glowTexture = useMemo(() => getSharedPlanetGlowTexture(), [])

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime()

    const currentAngle = config.angleOffset + time * config.orbitalSpeed * 0.08
    const incRad = THREE.MathUtils.degToRad(config.orbitalInclinationDeg)

    const px = SUN_POSITION.x + Math.cos(currentAngle) * config.orbitalDistanceAU
    const pz = SUN_POSITION.z + Math.sin(currentAngle) * config.orbitalDistanceAU
    const py =
      SUN_POSITION.y +
      Math.sin(currentAngle) * (config.orbitalDistanceAU * Math.sin(incRad))

    if (planetGroupRef.current) {
      planetGroupRef.current.position.set(px, py, pz)
    }

    if (spinMeshRef.current) {
      spinMeshRef.current.rotation.y += delta * config.spinSpeed
    }
  })

  return (
    <group ref={planetGroupRef} name={`PLANET_${config.name}`}>
      <group rotation={[0, 0, THREE.MathUtils.degToRad(config.axialTiltDeg)]}>
        <mesh
          ref={spinMeshRef}
          geometry={baseGeometry}
          material={planetMaterial}
          scale={config.scale}
          castShadow
          receiveShadow
        />

        {config.hasRing && (
          <mesh rotation={[Math.PI / 2.3, 0, 0]}>
            <ringGeometry
              args={[config.scale * 1.38, config.scale * 2.45, 48]}
            />
            <meshStandardMaterial
              color="#e2bf7d"
              side={THREE.DoubleSide}
              transparent={true}
              opacity={0.88}
              roughness={0.65}
              emissive="#f59e0b"
              emissiveIntensity={0.25}
              fog={false}
            />
          </mesh>
        )}
      </group>

      {/* Radiant atmospheric celestial glow halo */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh scale={[config.scale * 3.2, config.scale * 3.2, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={glowTexture}
            color={config.color}
            transparent={true}
            opacity={0.68}
            fog={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
    </group>
  )
}

// ─── 0. SEAMLESS EQUIRIDISTANT NEBULA SKYBOX SHADER (ZERO SEAMS) ──────────────
const seamlessNebulaVertexShader = `
  varying vec3 vWorldDir;
  void main() {
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const seamlessNebulaFragmentShader = `
  uniform sampler2D uMap;
  varying vec3 vWorldDir;
  
  void main() {
    vec3 dir = normalize(vWorldDir);
    float u = fract(0.5 + atan(dir.z, dir.x) / (2.0 * 3.14159265359));
    float v = clamp(0.5 - asin(clamp(dir.y, -1.0, 1.0)) / 3.14159265359, 0.002, 0.998);
    
    // Dual-phase trigonometric crossover completely eliminates any vertical seam line
    vec4 colA = texture2D(uMap, vec2(u, v));
    vec4 colB = texture2D(uMap, vec2(fract(u + 0.5), v));
    
    float seamDist = min(u, 1.0 - u);
    float blendFactor = smoothstep(0.0, 0.08, seamDist);
    
    vec3 seamlessCol = mix(colB.rgb, colA.rgb, blendFactor);
    gl_FragColor = vec4(seamlessCol, 1.0);
  }
`

function SeamlessCosmicNebulaSkybox({ texture }: { texture: THREE.Texture }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const { camera } = useThree()

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: seamlessNebulaVertexShader,
      fragmentShader: seamlessNebulaFragmentShader,
      uniforms: {
        uMap: { value: texture },
      },
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    })
  }, [texture])

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(camera.position)
    }
  })

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]} rotation={[0, -Math.PI / 4, 0]}>
      <sphereGeometry args={[24000, 64, 32]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  )
}

// ─── 6. COMPLETE SPACE STAGE ENVIRONMENT ROOT ─────────────────────────────────
export function SpaceStageEnvironment() {
  const { camera } = useThree()
  const isPlaying = useAppStore((s) => s.isPlaying)
  const audioPulse = useAppStore((s) => s.audioPulse)

  const nebulaTex = useTexture('/textures/starry-nebula-cosmic-dust.jpg')

  useEffect(() => {
    nebulaTex.colorSpace = THREE.SRGBColorSpace
    nebulaTex.wrapS = THREE.RepeatWrapping
    nebulaTex.wrapT = THREE.ClampToEdgeWrapping
    nebulaTex.minFilter = THREE.LinearFilter
    nebulaTex.magFilter = THREE.LinearFilter
    nebulaTex.generateMipmaps = false
    nebulaTex.needsUpdate = true
  }, [nebulaTex])

  const sharedPlanetGeometry = useMemo(
    () => new THREE.SphereGeometry(1, 32, 24),
    []
  )

  const sunLightRef = useRef<THREE.PointLight>(null!)
  const sunDirLightRef = useRef<THREE.DirectionalLight>(null!)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()
    const pulse = isPlaying ? (audioPulse || 0) : 0

    if (sunLightRef.current) {
      sunLightRef.current.intensity =
        6.5 + pulse * 2.2 + Math.sin(time * 2.2) * 0.5
    }
    if (sunDirLightRef.current) {
      sunDirLightRef.current.intensity = 2.4 + pulse * 0.8
    }
  })

  return (
    <group name="BALAA_SPACE_STAGE_ENVIRONMENT">
      {/* ── 1. Seamless Nebula Skybox Sphere (Dual-phase zero-seam shader) ──── */}
      <SeamlessCosmicNebulaSkybox texture={nebulaTex} />

      {/* ── 2. Real Shader-Based Active Twinkling Starfield (2,400 stars) ───── */}
      <TrueTwinklingShaderStarfield />

      {/* ── 3. Universal Cosmic Motion (Dust & shooting stars) ──────────────── */}
      <UniversalCosmicMotion />

      {/* ── 4. Local Stage Atmospheric Fog ──────────────────────────────────── */}
      <fogExp2 attach="fog" args={['#0c0d1e', 0.003]} />

      {/* ── 5. Sunlight Illuminating the Solar System & Stage from Sun Position ─ */}
      <directionalLight
        ref={sunDirLightRef}
        position={[SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z]}
        color="#ffaa22"
        intensity={2.4}
      />

      <pointLight
        ref={sunLightRef}
        position={[SUN_POSITION.x, SUN_POSITION.y, SUN_POSITION.z]}
        color="#ff8811"
        intensity={6.5}
        distance={6500}
        decay={1.05}
      />

      {/* Cool Cosmic Fill Light */}
      <hemisphereLight args={['#38bdf8', '#0f172a', 1.2]} />

      {/* ── 6. Colossal Sun in Deep Space (New Model + 2D Solar Furnace) ─────── */}
      <Suspense fallback={null}>
        <ColossalCentralSun />
      </Suspense>

      {/* ── 7. Massive Earth on the RIGHT View of Stage (Symmetrical 3D Volumetric Glow) ───── */}
      <Suspense fallback={null}>
        <MassiveEarthSatellitePerspective />
      </Suspense>

      {/* ── 8. 8 Grand Cartoon Cel-Shaded Planets in Keplerian Orbits ─────────── */}
      <group name="GRAND_SOLAR_SYSTEM_PLANETS">
        {GRAND_SOLAR_PLANETS.map((planet) => (
          <GrandKeplerianPlanet
            key={planet.name}
            config={planet}
            baseGeometry={sharedPlanetGeometry}
          />
        ))}
      </group>
    </group>
  )
}

// Preloads removed — models load on-demand via Suspense to avoid blocking initial render
