'use client'

import { Html, useTexture } from '@react-three/drei'
import { useEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getYouTubeEmbedUrl, REAL_DESS_MEDIA } from '@/lib/balaa-catalog'
import { useAppStore } from '@/store/useAppStore'

function ScreenNavButton({ label, x, onClick }: { label: string; x: number; onClick: () => void }) {
  return (
    <group position={[x, -1.92, 0.16]}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          onClick()
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[0.72, 0.36, 0.06]} />
        <meshStandardMaterial
          color="#18130e"
          emissive="#f97316"
          emissiveIntensity={0.35}
          metalness={0.65}
          roughness={0.25}
        />
      </mesh>
    </group>
  )
}

/**
 * StageMediaWall:
 * Renders the authentic 2D BALAA artwork display layer on the rear concert screen.
 *
 * Visual Features:
 * - Uses the official Balaa artwork/logo assets directly from the project branding.
 * - Deliberate 2D graphic concert visualizer layer positioned at the back of the screen.
 * - Reactive audio visualizer bars, cyber-studio framing lines, and performance telemetry.
 * - Embedded audio player synchronized with performance playback.
 * - Moves seamlessly locked to the stage during the Earth orbital trajectory.
 */
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

export function StageMediaWall() {
  const activeMediaId = useAppStore((s) => s.activeMediaId)
  const isPlaying = useAppStore((s) => s.isPlaying)
  const audioPulse = useAppStore((s) => s.audioPulse)
  const setActiveMediaId = useAppStore((s) => s.setActiveMediaId)

  const playerRef = useRef<HTMLIFrameElement>(null)
  const visualizerMeshRef = useRef<THREE.Mesh>(null!)

  const index = Math.max(0, REAL_DESS_MEDIA.findIndex((item) => item.id === activeMediaId))
  const item = REAL_DESS_MEDIA[index]

  // Pre-load all 8 compressed mural images
  const loadedMurals = useMemo(() => {
    return MURAL_URLS.map((url) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = url
      return img
    })
  }, [])

  // Generate high-resolution 2D graphic artwork canvas for the display
  const { displayCanvas, displayTexture, ctx } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1440
    canvas.height = 525
    const context = canvas.getContext('2d')!

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter

    return { displayCanvas: canvas, displayTexture: tex, ctx: context }
  }, [])

  // Throttle timer & slide state tracker
  const lastRenderTime = useRef(0)
  const lastDrawnSlideRef = useRef(-1)
  const isDrawnStaticRef = useRef(false)

  // Render 2D Bento Grid Art Wall with rotating mural slideshow & audio reactivity
  useFrame(({ clock }) => {
    if (!ctx) return
    const time = clock.getElapsedTime()

    // Slideshow crossfade indexing (6 second cycle with 1.2s crossfade)
    const cycleDuration = 6.0
    const cycleTime = time % cycleDuration
    const currentSlide = Math.floor(time / cycleDuration) % loadedMurals.length
    const nextSlide = (currentSlide + 1) % loadedMurals.length
    const isCrossfading = cycleTime > (cycleDuration - 1.2)
    const fadeAlpha = isCrossfading ? (cycleTime - (cycleDuration - 1.2)) / 1.2 : 0

    // IDLE OPTIMIZATION: When not playing and not crossfading, draw once per slide and skip all GPU uploads
    if (!isPlaying && !isCrossfading) {
      if (lastDrawnSlideRef.current === currentSlide && isDrawnStaticRef.current) {
        return // Static slide already uploaded: 0% GPU overhead
      }
    }

    // Throttle rendering: 20fps when playing audio EQ, 12fps during crossfade
    const throttleInterval = isPlaying ? 0.048 : 0.08
    if (time - lastRenderTime.current < throttleInterval && isDrawnStaticRef.current) return
    lastRenderTime.current = time
    lastDrawnSlideRef.current = currentSlide
    isDrawnStaticRef.current = !isCrossfading

    const pulse = isPlaying ? (audioPulse || 0) : 0
    const w = displayCanvas.width
    const h = displayCanvas.height

    // 1. Dark concert background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h)
    bgGrad.addColorStop(0, '#090604')
    bgGrad.addColorStop(0.5, '#140c06')
    bgGrad.addColorStop(1, '#070503')
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // Helper: Draw Bento Card with glowing border and image content
    const drawBentoCard = (
      img: HTMLImageElement | undefined,
      x: number,
      y: number,
      cardW: number,
      cardH: number,
      label: string,
      isHero = false,
      alpha = 1.0
    ) => {
      ctx.save()
      ctx.globalAlpha = alpha

      // Dark card container
      ctx.fillStyle = '#0f0a06'
      ctx.beginPath()
      ctx.roundRect(x, y, cardW, cardH, 14)
      ctx.fill()

      // Image fill
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(x, y, cardW, cardH, 14)
        ctx.clip()
        ctx.drawImage(img, x, y, cardW, cardH)
        // Subtle dark contrast vignette overlay
        const vig = ctx.createLinearGradient(x, y, x, y + cardH)
        vig.addColorStop(0, 'rgba(0, 0, 0, 0.12)')
        vig.addColorStop(0.7, 'rgba(0, 0, 0, 0.22)')
        vig.addColorStop(1, 'rgba(0, 0, 0, 0.72)')
        ctx.fillStyle = vig
        ctx.fillRect(x, y, cardW, cardH)
        ctx.restore()
      }

      // Glowing border
      ctx.strokeStyle = isHero ? '#f97316' : 'rgba(249, 115, 22, 0.45)'
      ctx.lineWidth = isHero ? 3.5 : 1.8
      if (isHero) {
        ctx.shadowColor = 'rgba(249, 115, 22, 0.85)'
        ctx.shadowBlur = 18 + pulse * 14
      }
      ctx.beginPath()
      ctx.roundRect(x, y, cardW, cardH, 14)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Label badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)'
      ctx.beginPath()
      ctx.roundRect(x + 12, y + cardH - 32, label.length * 9 + 20, 22, 6)
      ctx.fill()
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#fbbf24'
      ctx.font = '900 11px monospace'
      ctx.letterSpacing = '2px'
      ctx.textAlign = 'left'
      ctx.fillText(label, x + 20, y + cardH - 17)

      ctx.restore()
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. BENTO GRID TILES: LEFT FLANK
    // ──────────────────────────────────────────────────────────────────────────
    const leftImg1 = loadedMurals[(currentSlide + 1) % loadedMurals.length]
    const leftImg2 = loadedMurals[(currentSlide + 2) % loadedMurals.length]
    drawBentoCard(leftImg1, 35, 45, 410, 265, 'STREET ART • 01')
    drawBentoCard(leftImg2, 35, 330, 410, 265, 'BALAA GRAFFITI • 02')

    // Left audio visualizer bars inside lower card
    ctx.save()
    for (let i = 0; i < 10; i++) {
      const bH = Math.max(6, (Math.sin(time * 5 + i * 0.7) * 0.5 + 0.5) * 55 + pulse * 40)
      const bx = 65 + i * 18
      const by = 550 - bH
      ctx.fillStyle = '#f97316'
      ctx.fillRect(bx, by, 12, bH)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(bx, by - 3, 12, 2)
    }
    ctx.restore()

    // ──────────────────────────────────────────────────────────────────────────
    // 3. BENTO GRID TILES: RIGHT FLANK
    // ──────────────────────────────────────────────────────────────────────────
    const rightImg1 = loadedMurals[(currentSlide + 3) % loadedMurals.length]
    const rightImg2 = loadedMurals[(currentSlide + 4) % loadedMurals.length]
    drawBentoCard(rightImg1, 1475, 45, 410, 265, 'URBAN MURAL • 03')
    drawBentoCard(rightImg2, 1475, 330, 410, 265, 'HIP-HOP ARCHIVE • 04')

    // Right oscilloscope waveform line inside lower card
    ctx.save()
    ctx.beginPath()
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2
    for (let ox = 1500; ox < 1850; ox += 6) {
      const oy = 460 + Math.sin(time * 8 + ox * 0.05) * (14 + pulse * 20)
      if (ox === 1500) ctx.moveTo(ox, oy)
      else ctx.lineTo(ox, oy)
    }
    ctx.stroke()
    ctx.restore()

    // ──────────────────────────────────────────────────────────────────────────
    // 4. CENTER HERO CARD (SLIDESHOW CROSSFADE)
    // ──────────────────────────────────────────────────────────────────────────
    const heroX = 475
    const heroY = 45
    const heroW = 970
    const heroH = 550

    // Draw current hero slide
    const currentHeroImg = loadedMurals[currentSlide]
    drawBentoCard(currentHeroImg, heroX, heroY, heroW, heroH, `BALAA EXHIBIT • 0${currentSlide + 1}`, true, 1.0)

    // Crossfade next hero slide when transitioning
    if (fadeAlpha > 0) {
      const nextHeroImg = loadedMurals[nextSlide]
      drawBentoCard(nextHeroImg, heroX, heroY, heroW, heroH, `BALAA EXHIBIT • 0${nextSlide + 1}`, true, fadeAlpha)
    }

    // Centered Responsive Glowing Header Typography & Emblem
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Ambient Orange Backglow
    ctx.shadowColor = 'rgba(249, 115, 22, 0.95)'
    ctx.shadowBlur = 24 + pulse * 12
    ctx.fillStyle = '#fbbf24'
    ctx.font = '900 32px monospace'
    ctx.letterSpacing = '8px'
    ctx.fillText('BALAA STUDIOS', w / 2, heroY + 48)
    
    // Sub-header badge
    ctx.shadowBlur = 0
    ctx.font = '700 11px monospace'
    ctx.letterSpacing = '4px'
    ctx.fillStyle = '#fed7aa'
    ctx.fillText('OFFICIAL DIGITAL PERFORMANCE & MERCH SHOWROOM', w / 2, heroY + 76)
    ctx.restore()

    // ──────────────────────────────────────────────────────────────────────────
    // 5. BOTTOM WIDE AUDIO EQUALIZER DANCE DECK
    // ──────────────────────────────────────────────────────────────────────────
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 15px monospace'
    ctx.letterSpacing = '4px'
    ctx.fillText(`BALAA LIVE • ${item.title.toUpperCase()}`, w / 2, h - 68)

    const numBars = 56
    const barWidth = 14
    const barGap = 10
    const totalBarsWidth = numBars * (barWidth + barGap) - barGap
    const startX = (w - totalBarsWidth) / 2

    for (let i = 0; i < numBars; i++) {
      const barHeight = isPlaying
        ? Math.max(6, (Math.sin(time * 6 + i * 0.4) * 0.5 + 0.5) * 40 + pulse * 45)
        : Math.sin(time * 2 + i * 0.3) * 4 + 8

      const bx = startX + i * (barWidth + barGap)
      const by = h - 18 - barHeight

      const barGrad = ctx.createLinearGradient(bx, by, bx, by + barHeight)
      barGrad.addColorStop(0, '#ffffff')
      barGrad.addColorStop(0.35, '#fbbf24')
      barGrad.addColorStop(1, '#ea580c')

      ctx.fillStyle = barGrad
      ctx.fillRect(bx, by, barWidth, barHeight)
    }

    displayTexture.needsUpdate = true
  })

  const select = (offset: number) => {
    setActiveMediaId(
      REAL_DESS_MEDIA[(index + offset + REAL_DESS_MEDIA.length) % REAL_DESS_MEDIA.length].id
    )
  }

  const commandPlayer = (command: 'playVideo' | 'pauseVideo') => {
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: command, args: [] }),
      'https://www.youtube-nocookie.com'
    )
  }

  // Continuous Auto-Play: Listen for YouTube video ended events (state 0 = YT.PlayerState.ENDED)
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (payload && (payload.event === 'onStateChange' || payload.info === 0 || payload.data === 0)) {
          if (payload.info === 0 || payload.data === 0) {
            // Track ended -> Automatically advance to the next song in the catalogue
            select(1)
          }
        }
      } catch {}
    }

    window.addEventListener('message', handleWindowMessage)
    return () => window.removeEventListener('message', handleWindowMessage)
  }, [index])

  useEffect(() => {
    commandPlayer(isPlaying ? 'playVideo' : 'pauseVideo')
  }, [isPlaying, item.youtubeVideoId])

  return (
    <group name="BALAA_MOUNTED_MEDIA_WALL" position={[0, 2.55, -2.94]}>
      {/* 2D Balaa Artwork Display Screen */}
      <mesh
        ref={visualizerMeshRef}
        position={[0, 0.1, 0.14]}
        onClick={() => select(1)}
      >
        <planeGeometry args={[12.15, 4.4]} />
        <meshBasicMaterial map={displayTexture} toneMapped={false} />
      </mesh>

      {/* Synchronized audio player instance */}
      <Html
        transform
        position={[0, -3, -0.2]}
        distanceFactor={0.001}
        zIndexRange={[0, 0]}
        wrapperClass="balaa-mounted-player"
      >
        <div
          style={{ width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <iframe
            ref={playerRef}
            key={item.id}
            onLoad={() => {
              if (isPlaying) commandPlayer('playVideo')
            }}
            style={{ width: 1, height: 1, border: 0 }}
            src={getYouTubeEmbedUrl(item)}
            title={`${item.title} — mounted stage player`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </Html>

      {/* Screen Bezel Trim Bars */}
      <mesh position={[0, 2.09, 0.15]}>
        <planeGeometry args={[11.85, 0.34]} />
        <meshBasicMaterial color="#09090c" />
      </mesh>
      <mesh position={[0, -2.09, 0.15]}>
        <planeGeometry args={[11.85, 0.34]} />
        <meshBasicMaterial color="#09090c" />
      </mesh>

      <ScreenNavButton label="‹" x={-5.25} onClick={() => select(-1)} />
      <ScreenNavButton label="›" x={5.25} onClick={() => select(1)} />
    </group>
  )
}
