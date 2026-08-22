'use client'

import { Float, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useMemo, useRef } from 'react'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'
import { useStageLayoutStore } from '@/store/useStageLayoutStore'
import { TexturedMerchGarment } from './TexturedMerchGarment'
import { MERCH_ITEMS } from '@/lib/merch'
import type { BalaaStageMode } from '@/lib/balaa-catalog'

type AssetProps = { url: string; position: [number, number, number]; rotation?: [number, number, number]; targetHeight: number; onClick?: () => void }

function SizedAsset({ url, position, rotation = [0, 0, 0], targetHeight, onClick }: AssetProps) {
  const { scene } = useGLTF(url)
  const object = useMemo(() => {
    const copy = clone(scene)
    const box = new THREE.Box3().setFromObject(copy)
    const size = box.getSize(new THREE.Vector3())
    // Source props use mixed up axes. Cap by their largest dimension so no
    // sideways desk, rack, or cable can grow taller/wider than the artist.
    const scale = targetHeight / Math.max(size.x, size.y, size.z, 0.001)
    copy.scale.setScalar(scale)
    const scaledBox = new THREE.Box3().setFromObject(copy)
    copy.position.y -= scaledBox.min.y
    copy.traverse((child: THREE.Object3D) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      mesh.castShadow = true; mesh.receiveShadow = true
      const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mesh.material = sourceMaterials.map((material) => {
        const textured = material.clone() as THREE.MeshStandardMaterial
        if (textured.map) textured.map.colorSpace = THREE.SRGBColorSpace
        if (textured.emissiveMap) textured.emissiveMap.colorSpace = THREE.SRGBColorSpace
        textured.needsUpdate = true
        return textured
      })
    })
    return copy
  }, [scene, targetHeight])
  return <group position={position} rotation={rotation} onClick={(event) => { event.stopPropagation(); onClick?.() }}><primitive object={object} /></group>
}

function StudioAsset(props: AssetProps) { return <SizedAsset {...props} /> }

function StudioFallback({ position, targetHeight }: Pick<AssetProps, 'position' | 'targetHeight'>) {
  return <group position={position}><mesh position={[0, targetHeight / 2, 0]} castShadow receiveShadow><boxGeometry args={[targetHeight * .72, targetHeight, targetHeight * .42]} /><meshStandardMaterial color="#1c2430" metalness={.72} roughness={.32} emissive="#0f172a" emissiveIntensity={.35} /></mesh><mesh position={[0, targetHeight * .76, targetHeight * .22]}><planeGeometry args={[targetHeight * .42, targetHeight * .22]} /><meshBasicMaterial color="#2dd4bf" /></mesh></group>
}

function PaybillSignFace() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 960
    const context = canvas.getContext('2d')!

    // Green M-Pesa gradient background
    const bg = context.createLinearGradient(0, 0, 0, 960)
    bg.addColorStop(0, '#00853f')
    bg.addColorStop(0.5, '#00a651')
    bg.addColorStop(1, '#006830')
    context.fillStyle = bg
    context.fillRect(0, 0, canvas.width, canvas.height)

    // White border
    context.strokeStyle = '#ffffff'
    context.lineWidth = 12
    context.strokeRect(12, 12, 576, 936)

    context.fillStyle = '#ffffff'
    context.textAlign = 'center'
    context.font = '900 76px Arial, sans-serif'
    context.fillText('M-PESA', 300, 180)

    context.fillStyle = '#e8ffea'
    context.font = '700 38px Arial, sans-serif'
    context.fillText('BUY GOODS TILL', 300, 310)

    // Till number highlight card
    context.fillStyle = '#ffffff'
    context.fillRect(40, 390, 520, 180)
    context.fillStyle = '#007a38'
    context.font = '900 92px Arial, sans-serif'
    context.fillText('5834631', 300, 520)

    context.fillStyle = '#ffffff'
    context.font = '900 34px Arial, sans-serif'
    context.fillText('REAL DESS VAULT', 300, 690)

    context.fillStyle = '#e8ffea'
    context.font = '700 26px Arial, sans-serif'
    context.fillText('MUSIC • SERVICES • MERCH', 300, 750)
    context.fillText('INSTANT DIGITAL CLEARANCE', 300, 800)

    const result = new THREE.CanvasTexture(canvas)
    result.colorSpace = THREE.SRGBColorSpace
    result.needsUpdate = true
    return result
  }, [])

  return (
    <mesh position={[0, 0, 0.055]}>
      <planeGeometry args={[1.0, 1.64]} />
      <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

const EASTER_EGG_URL = 'https://omg10.com/4/9848713'

function DontPressSignFace() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 600
    canvas.height = 960
    const ctx = canvas.getContext('2d')!

    // Red hazard background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 960)
    bgGrad.addColorStop(0, '#1c0505')
    bgGrad.addColorStop(0.5, '#450a0a')
    bgGrad.addColorStop(1, '#1a0303')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 600, 960)

    // Hazard border
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 14
    ctx.strokeRect(10, 10, 580, 940)

    // Inner subtle border
    ctx.strokeStyle = 'rgba(254, 202, 202, 0.35)'
    ctx.lineWidth = 3
    ctx.strokeRect(26, 26, 548, 908)

    ctx.textAlign = 'center'

    // Header
    ctx.fillStyle = '#fbbf24'
    ctx.font = '900 52px monospace'
    ctx.fillText('⚠ ATMOSPHERE', 300, 115)

    ctx.fillStyle = '#fca5a5'
    ctx.font = '700 28px monospace'
    ctx.fillText('HABITAT PURGE OVERRIDE', 300, 168)

    // Red Emergency Button Graphic
    const btnX = 300
    const btnY = 390
    const btnR = 150

    // Outer glow ring
    const ringGrad = ctx.createRadialGradient(btnX, btnY, btnR - 10, btnX, btnY, btnR + 35)
    ringGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)')
    ringGrad.addColorStop(1, 'rgba(239, 68, 68, 0)')
    ctx.fillStyle = ringGrad
    ctx.beginPath()
    ctx.arc(btnX, btnY, btnR + 35, 0, Math.PI * 2)
    ctx.fill()

    // Outer Bezel
    ctx.fillStyle = '#18181b'
    ctx.beginPath()
    ctx.arc(btnX, btnY, btnR + 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#71717a'
    ctx.lineWidth = 5
    ctx.stroke()

    // Main Glossy Red Button Dome
    const btnGrad = ctx.createRadialGradient(btnX - 35, btnY - 45, 10, btnX, btnY, btnR)
    btnGrad.addColorStop(0, '#f87171')
    btnGrad.addColorStop(0.35, '#dc2626')
    btnGrad.addColorStop(0.85, '#991b1b')
    btnGrad.addColorStop(1, '#450a0a')
    ctx.fillStyle = btnGrad
    ctx.beginPath()
    ctx.arc(btnX, btnY, btnR, 0, Math.PI * 2)
    ctx.fill()

    // Button Text
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 42px Arial, sans-serif'
    ctx.fillText("DON'T", btnX, btnY - 12)
    ctx.fillText('PRESS', btnX, btnY + 42)

    // Life-Support Status Text
    ctx.fillStyle = '#4ade80'
    ctx.font = '900 34px monospace'
    ctx.fillText('O₂ 21% • STABLE', 300, 640)

    ctx.fillStyle = '#f87171'
    ctx.font = '700 26px monospace'
    ctx.fillText('CRITICAL HABITAT PROTOCOL', 300, 695)

    ctx.fillStyle = '#fed7aa'
    ctx.font = '600 22px monospace'
    ctx.fillText('DO NOT ENGAGE IN ORBIT', 300, 745)
    ctx.fillText('STAGE LOCK: ACTIVE', 300, 788)

    const result = new THREE.CanvasTexture(canvas)
    result.colorSpace = THREE.SRGBColorSpace
    result.needsUpdate = true
    return result
  }, [])

  const handleClick = (e: any) => {
    e.stopPropagation()
    window.open(EASTER_EGG_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <mesh
      position={[0, 0, 0.055]}
      onClick={handleClick}
      onPointerOver={() => { document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = 'auto' }}
    >
      <planeGeometry args={[1.0, 1.64]} />
      <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

const MISSION_LAUNCH_EPOCH = new Date('2024-01-01T00:00:00Z').getTime()
const ORBITAL_PERIOD_MINUTES = 92.68

function OrbitalMetadataPoleBannerFace() {
  const { canvas, texture, ctx } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 800
    c.height = 1280
    const context = c.getContext('2d')!
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return { canvas: c, texture: tex, ctx: context }
  }, [])

  const lastUpdate = useRef(0)

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime()
    if (time - lastUpdate.current < 0.5) return
    lastUpdate.current = time

    const now = Date.now()
    const elapsedMs = now - MISSION_LAUNCH_EPOCH
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    const elapsedMinutes = elapsedMs / (1000 * 60)
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)

    const orbits = (elapsedMinutes / ORBITAL_PERIOD_MINUTES).toFixed(2)
    const d = Math.floor(elapsedDays)
    const frac = (elapsedDays - d).toFixed(4).substring(1)
    const h = String(Math.floor((elapsedSeconds % 86400) / 3600)).padStart(2, '0')
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(elapsedSeconds % 60).padStart(2, '0')

    // 1. Dark sleek cyber panel background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1280)
    bgGrad.addColorStop(0, '#0a0604')
    bgGrad.addColorStop(0.5, '#160d07')
    bgGrad.addColorStop(1, '#080402')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 800, 1280)

    // 2. Glowing Orange Outer Border
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 14
    ctx.strokeRect(10, 10, 780, 1260)

    // Inner subtle border
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'
    ctx.lineWidth = 3
    ctx.strokeRect(26, 26, 748, 1228)

    // 3. Header badge
    ctx.fillStyle = '#f97316'
    ctx.beginPath()
    ctx.arc(65, 80, 18, 0, Math.PI * 2)
    ctx.fill()

    ctx.textAlign = 'left'
    ctx.fillStyle = '#fbbf24'
    ctx.font = '900 42px monospace'
    ctx.letterSpacing = '5px'
    ctx.fillText('ORBITAL METADATA', 105, 94)

    // 4. Primary Counter Card
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)'
    ctx.lineWidth = 3
    ctx.fillRect(45, 140, 710, 320)
    ctx.strokeRect(45, 140, 710, 320)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#fed7aa'
    ctx.font = '700 30px monospace'
    ctx.fillText('TIME IN EARTH ORBIT', 400, 195)

    ctx.fillStyle = '#fbbf24'
    ctx.font = '900 70px monospace'
    ctx.shadowColor = 'rgba(249, 115, 22, 0.95)'
    ctx.shadowBlur = 20
    ctx.fillText(`DAY ${d.toLocaleString()}${frac}`, 400, 295)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffffff'
    ctx.font = '800 30px monospace'
    ctx.fillText(`T+ ${h}:${m}:${s}  •  ${Number(orbits).toLocaleString()} REVS`, 400, 390)

    // 5. Aerospace Telemetry Specs
    const drawRow = (label: string, val: string, y: number, highlight = false) => {
      ctx.textAlign = 'left'
      ctx.fillStyle = '#fed7aa'
      ctx.font = '700 28px monospace'
      ctx.fillText(label, 60, y)

      ctx.textAlign = 'right'
      ctx.fillStyle = highlight ? '#fbbf24' : '#ffffff'
      ctx.font = '900 32px monospace'
      ctx.fillText(val, 740, y)
    }

    drawRow('ALTITUDE:', '418.4 KM (LEO)', 530, true)
    drawRow('VELOCITY:', '7.66 KM/S', 610, true)
    drawRow('ORBIT SPEED:', '27,576 KM/H', 690)
    drawRow('ORBITAL HOST:', 'EARTH (Alpha)', 770, true)
    drawRow('INCLINATION:', '23.44°', 850)
    drawRow('ORBIT PERIOD:', '92.68 MIN', 930)
    drawRow('SOLAR FLUX:', '1,361 W/m²', 1010)

    // 6. Footer Status
    ctx.fillStyle = '#f97316'
    ctx.fillRect(45, 1150, 710, 75)
    ctx.fillStyle = '#140a05'
    ctx.textAlign = 'center'
    ctx.font = '900 32px monospace'
    ctx.fillText('STAGE STATUS: NOMINAL', 400, 1198)

    texture.needsUpdate = true
  })

  return (
    <mesh position={[0, 0, 0.055]}>
      <planeGeometry args={[1.22, 2.1]} />
      <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

const MURAL_URLS = [
  '/branding/murals/mural_01.webp',
  '/branding/murals/mural_02.webp',
  '/branding/murals/mural_03.webp',
  '/branding/murals/mural_04.webp',
  '/branding/murals/mural_05.webp',
  '/branding/murals/mural_06.webp',
  '/branding/murals/mural_07.webp',
  '/branding/murals/mural_08.webp',
]

function BalaaRearMuralFace() {
  const loadedMurals = useMemo(() => {
    return MURAL_URLS.map((url) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = url
      return img
    })
  }, [])

  const { canvas, texture, ctx } = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1920
    c.height = 760
    const context = c.getContext('2d')!
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return { canvas: c, texture: tex, ctx: context }
  }, [])

  const lastUpdate = useRef(0)
  const hasDrawnInitialRef = useRef(false)
  const cameraMode = useAppStore((s) => s.cameraMode)

  useFrame(({ clock }) => {
    // In Artist mode: rear wall is behind the screen, never seen. Draw once and skip all per-frame work.
    if (cameraMode === 'artist' && hasDrawnInitialRef.current) return

    const time = clock.getElapsedTime()
    // Throttle to 10fps when exploring behind stage
    if (time - lastUpdate.current < 0.1) return
    lastUpdate.current = time
    hasDrawnInitialRef.current = true

    const w = canvas.width
    const h = canvas.height

    // Energetic Asymmetrical Street Art & Graffiti Composition
    // 1. Dynamic background with subtle paint splatter / urban grid
    const bgGrad = ctx.createLinearGradient(0, 0, w, h)
    bgGrad.addColorStop(0, '#0a0604')
    bgGrad.addColorStop(0.3, '#180d06')
    bgGrad.addColorStop(0.7, '#120804')
    bgGrad.addColorStop(1, '#080503')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Street Art Tag Splashes / Stencil Backdrops
    ctx.save()
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.25)'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 18; i++) {
      const sx = (i * 115) % w
      const sy = 40 + (i * 65) % (h - 80)
      ctx.beginPath()
      ctx.moveTo(sx, sy)
      ctx.lineTo(sx + 80, sy + 35)
      ctx.stroke()
    }
    ctx.restore()

    // Outer neon glowing graffiti frame
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 5
    ctx.strokeRect(16, 16, w - 32, h - 32)

    // Slideshow crossfade indexing
    const cycleDuration = 6.0
    const cycleTime = time % cycleDuration
    const currentSlide = Math.floor(time / cycleDuration) % loadedMurals.length
    const nextSlide = (currentSlide + 1) % loadedMurals.length
    const fadeAlpha = cycleTime > (cycleDuration - 1.2) ? (cycleTime - (cycleDuration - 1.2)) / 1.2 : 0

    // Helper: Draw Asymmetric Layered Graffiti Tile with rotation and tape accents
    const drawStreetTile = (
      img: HTMLImageElement | undefined,
      x: number,
      y: number,
      tw: number,
      th: number,
      label: string,
      rotDeg = 0,
      alpha = 1.0,
      tapeColor = '#f59e0b'
    ) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.translate(x + tw / 2, y + th / 2)
      ctx.rotate((rotDeg * Math.PI) / 180)
      ctx.translate(-(tw / 2), -(th / 2))

      // Dark card base
      ctx.fillStyle = '#0f0a06'
      ctx.beginPath()
      ctx.roundRect(0, 0, tw, th, 10)
      ctx.fill()

      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(0, 0, tw, th, 10)
        ctx.clip()
        ctx.drawImage(img, 0, 0, tw, th)
        
        // Urban vignette
        const vig = ctx.createLinearGradient(0, 0, 0, th)
        vig.addColorStop(0, 'rgba(0,0,0,0.15)')
        vig.addColorStop(0.7, 'rgba(0,0,0,0.25)')
        vig.addColorStop(1, 'rgba(0,0,0,0.75)')
        ctx.fillStyle = vig
        ctx.fillRect(0, 0, tw, th)
        ctx.restore()
      }

      // Glowing urban stroke
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.65)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.roundRect(0, 0, tw, th, 10)
      ctx.stroke()

      // Duct Tape accent corner
      ctx.fillStyle = tapeColor
      ctx.globalAlpha = alpha * 0.85
      ctx.fillRect(-12, -8, 48, 14)
      ctx.fillRect(tw - 36, th - 6, 48, 14)
      ctx.globalAlpha = alpha

      // Street Badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.88)'
      ctx.beginPath()
      ctx.roundRect(12, th - 32, label.length * 8 + 22, 22, 5)
      ctx.fill()
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#fbbf24'
      ctx.font = '900 11px monospace'
      ctx.letterSpacing = '1.5px'
      ctx.textAlign = 'left'
      ctx.fillText(label, 20, th - 17)

      ctx.restore()
    }

    // Layered, Asymmetrical Collage Layout (Energetic Street Art Composition)
    // Left Overlapping Flank
    drawStreetTile(loadedMurals[(currentSlide + 1) % loadedMurals.length], 45, 40, 430, 310, 'STREET ART • 01', -1.2)
    drawStreetTile(loadedMurals[(currentSlide + 2) % loadedMurals.length], 65, 385, 410, 320, 'BALAA GRAFFITI • 02', 1.5, 1.0, '#ef4444')

    // Right Overlapping Flank
    drawStreetTile(loadedMurals[(currentSlide + 3) % loadedMurals.length], 1445, 45, 430, 310, 'URBAN MURAL • 03', 1.4)
    drawStreetTile(loadedMurals[(currentSlide + 4) % loadedMurals.length], 1430, 385, 430, 320, 'HIP-HOP ARCHIVE • 04', -1.1, 1.0, '#06b6d4')

    // Center Grand Hero Wall Piece
    const heroImg = loadedMurals[currentSlide]
    drawStreetTile(heroImg, 495, 45, 930, 660, `BALAA EXHIBIT • 0${currentSlide + 1}`, 0, 1.0, '#f97316')
    if (fadeAlpha > 0) {
      drawStreetTile(loadedMurals[nextSlide], 495, 45, 930, 660, `BALAA EXHIBIT • 0${nextSlide + 1}`, 0, fadeAlpha, '#f97316')
    }

    // Header: Centered energetic glowing BALAA STUDIOS graffiti piece
    ctx.save()
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(249, 115, 22, 0.95)'
    ctx.shadowBlur = 28
    ctx.fillStyle = '#fbbf24'
    ctx.font = '900 36px monospace'
    ctx.letterSpacing = '10px'
    ctx.fillText('BALAA STUDIOS', w / 2, 95)
    ctx.restore()

    texture.needsUpdate = true
  })

  return (
    <mesh position={[0, 0, -0.125]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[12.6, 4.8]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

/** Real GLB objects arranged as a production suite, never as placeholder boxes. */
export function BalaaPhysicalSet({ onNavigate }: { onNavigate?: (mode: BalaaStageMode) => void }) {
  const setOutfit = useAppStore((s) => s.setOutfit)
  const setMerchDrawerOpen = useAppStore((s) => s.setMerchDrawerOpen)
  const setSelectedMerch = useAppStore((s) => s.setSelectedMerch)
  const items = useStageLayoutStore((s) => s.items)
  const selectLayoutItem = useStageLayoutStore((s) => s.select)
  const selectGarment = (look: string) => {
    setOutfit(look)
    setSelectedMerch(MERCH_ITEMS[look] || null)
    setMerchDrawerOpen(false)
    onNavigate?.('wardrobe')
  }
  const layout = (id: string) => items[id]

  return (
    <group name="BALAA_REAL_ASSET_SHOWROOM">
      {/* Opaque rear media wall frame with 2D Artwork Mural on the back face (Section A). */}
      <group position={[0, 2.55, -3.1]}>
        <mesh castShadow receiveShadow><boxGeometry args={[12.8, 5.05, 0.24]} /><meshStandardMaterial color="#07070a" metalness={0.72} roughness={0.26} /></mesh>
        <mesh position={[0, -2.18, 0.17]}><boxGeometry args={[12.6, 0.12, 0.18]} /><meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={2} /></mesh>
        {/* Creative 2D Balaa Artwork Mural covering the entire rear exterior wall */}
        <BalaaRearMuralFace />
      </group>

      {/* Fixed to the left front pole: M-Pesa in-world payment sign (angled inward toward audience). */}
      <group name="REAL_DESS_MPESA_PAYBILL" position={[-6.85, 2.2, 3.2]} rotation={[0, Math.PI / 8, 0]}>
        <mesh castShadow><boxGeometry args={[1.08, 1.72, 0.08]} /><meshStandardMaterial color="#032b1c" metalness={0.64} roughness={0.35} emissive="#00170d" emissiveIntensity={0.35} /></mesh>
        <PaybillSignFace />
      </group>

      {/* Fixed to the right front pole: DON'T PRESS emergency purge banner (angled inward toward audience). */}
      <group name="BALAA_DONT_PRESS_POLE_BANNER" position={[6.85, 2.2, 3.2]} rotation={[0, -Math.PI / 8, 0]}>
        <mesh castShadow><boxGeometry args={[1.08, 1.72, 0.08]} /><meshStandardMaterial color="#450a0a" metalness={0.64} roughness={0.35} emissive="#200505" emissiveIntensity={0.35} /></mesh>
        <DontPressSignFace />
      </group>

      {/* Mounted to the rear right pillar/truss: Live 3D Orbital Metadata Telemetry Banner Display */}
      <group name="BALAA_ORBITAL_METADATA_PILLAR_BANNER" position={[6.85, 3.15, -2.85]} rotation={[0, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.30, 2.18, 0.08]} />
          <meshStandardMaterial color="#0c0704" metalness={0.72} roughness={0.25} emissive="#120804" emissiveIntensity={0.4} />
        </mesh>
        <OrbitalMetadataPoleBannerFace />
      </group>

      {/* Fashion/merch left — actual final garment GLBs on a showroom rail. */}
      <group name="BALAA_MERCH_LEFT">
        {Array.from({ length: 9 }, (_, index) => {
          const id = `merch-${String(index + 1).padStart(2, '0')}`
          const item = layout(id)
          return <Float key={id} speed={0.7 + index * 0.04} floatIntensity={0.13} rotationIntensity={0.015}><TexturedMerchGarment look={index + 1} position={item.position} rotation={item.rotation} maxExtent={item.targetHeight} onClick={() => { selectLayoutItem(id); selectGarment(`look_${String(index + 1).padStart(2, '0')}`) }} /></Float>
        })}
        <mesh position={[-5.8, 0.08, -1.45]}><boxGeometry args={[3.8, 0.16, 0.72]} /><meshStandardMaterial color="#181818" metalness={0.72} roughness={0.33} /></mesh>
      </group>

      {/* Production/services right — supplied props, scale-normalised from GLB bounds. */}
      <group name="BALAA_CREATIVE_SERVICES_RIGHT">
        {[
          ['desk', 'modern_desk.glb'], ['console', 'mixing_console.glb'], ['monitor', 'studio_monitor_speaker.glb'], ['audio-rack', 'audio_equipment_rack.glb'],
          ['equipment-rack', 'equipment_rack.glb'], ['synth', 'synthesizer_keyboard.glb'], ['boom', 'microphone_boom_stand.glb'], ['cable', 'coiled_audio_cable.glb'],
        ].map(([id, file]) => { const item = layout(id); return <Suspense key={id} fallback={<StudioFallback position={item.position} targetHeight={item.targetHeight} />}><StudioAsset url={`/library/props/${file}`} position={item.position} rotation={item.rotation} targetHeight={item.targetHeight} onClick={() => { selectLayoutItem(id); onNavigate?.('services') }} /></Suspense> })}
      </group>
    </group>
  )
}
