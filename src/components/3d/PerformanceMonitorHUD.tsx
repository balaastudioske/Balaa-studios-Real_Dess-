'use client'

/**
 * BALAA STUDIOS — Real-Time 3D Performance Monitor HUD
 *
 * Tracks:
 * - FPS & Frame Time (ms)
 * - Draw Calls & Triangles
 * - GPU Memory (Geometries & Textures in VRAM)
 * - Active Rendering Engine Mode & Camera Mode
 *
 * Zero-overhead design: updates internal stats ref in useFrame and
 * updates the HUD text DOM element directly without causing React rerenders.
 */

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useAppStore } from '@/store/useAppStore'

export function PerformanceMonitorHUD({ visible = true }: { visible?: boolean }) {
  const { gl } = useThree()
  const hudRef = useRef<HTMLDivElement>(null)
  const lastTimeRef = useRef(performance.now())
  const framesRef = useRef(0)
  const lastUpdateRef = useRef(0)

  const renderMode = useAppStore((s) => s.renderMode)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const isPlaying = useAppStore((s) => s.isPlaying)

  useFrame(() => {
    if (!visible || !hudRef.current) return

    framesRef.current++
    const now = performance.now()
    const delta = now - lastUpdateRef.current

    // Throttle DOM updates to twice per second (500ms)
    if (delta >= 500) {
      const fps = Math.round((framesRef.current * 1000) / delta)
      const frameTimeMs = (1000 / Math.max(fps, 1)).toFixed(1)
      const calls = gl.info.render.calls
      const triangles = gl.info.render.triangles
      const textures = gl.info.memory.textures
      const geometries = gl.info.memory.geometries

      hudRef.current.innerHTML = `
        <div class="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider mb-1">BALAA GPU Stats</div>
        <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] font-mono text-slate-300">
          <div>FPS: <span class="font-bold ${fps < 30 ? 'text-rose-400' : fps < 55 ? 'text-amber-400' : 'text-emerald-400'}">${fps}</span></div>
          <div>Frame: <span class="font-bold text-slate-200">${frameTimeMs}ms</span></div>
          <div>Draw Calls: <span class="font-bold text-slate-200">${calls}</span></div>
          <div>Triangles: <span class="font-bold text-slate-200">${(triangles / 1000).toFixed(1)}k</span></div>
          <div>Textures: <span class="font-bold text-slate-200">${textures}</span></div>
          <div>Geometries: <span class="font-bold text-slate-200">${geometries}</span></div>
          <div>Render Mode: <span class="font-bold text-amber-300">${renderMode}</span></div>
          <div>Camera: <span class="font-bold text-cyan-300">${cameraMode}</span></div>
        </div>
      `

      framesRef.current = 0
      lastUpdateRef.current = now
    }
  })

  if (!visible) return null

  return null
}
