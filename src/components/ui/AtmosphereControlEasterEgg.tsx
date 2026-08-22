'use client'

import React, { useState, useCallback } from 'react'
import { AlertOctagon } from 'lucide-react'

// Fixed destination constant (safe, immutable)
const EASTER_EGG_DESTINATION = 'https://omg10.com/4/9848713'

/**
 * AtmosphereControlEasterEgg:
 * A sleek 2D glass HUD banner mounted in the space habitat UI.
 *
 * Visual design:
 * - Second compact banner matching the M-Pesa / telemetry banner aesthetics.
 * - Displays habitat life-support status (O₂ 21% • PRESSURE STABLE).
 * - Houses the legendary glossy red "DON'T PRESS" button with pulse glow and press feedback.
 * - On click, redirects to https://omg10.com/4/9848713.
 */
export function AtmosphereControlEasterEgg() {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleActivate = useCallback((e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setIsPressed(true)

    // Brief mechanical feedback before navigation
    setTimeout(() => {
      window.location.href = EASTER_EGG_DESTINATION
    }, 180)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleActivate(e)
      }
    },
    [handleActivate]
  )

  return (
    <aside
      aria-label="Habitat Atmosphere Control Banner"
      className="pointer-events-auto absolute left-4 top-4 z-40 select-none font-mono text-xs transition-all duration-300 md:left-6"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Sleek Frosted Glass HUD Banner */}
      <div className="flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-slate-950/80 px-3 py-2 text-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.6),0_0_16px_rgba(239,68,68,0.12)] backdrop-blur-xl transition-all duration-300 hover:border-red-500/45 hover:shadow-[0_6px_32px_rgba(0,0,0,0.7),0_0_24px_rgba(239,68,68,0.2)]">
        
        {/* Atmosphere Life-Support Indicator */}
        <div className="flex items-center gap-2 pr-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          </span>
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-300">
              ATMOSPHERE <span className="text-emerald-400">O₂ 21%</span>
            </span>
            <span className="text-[8px] font-medium tracking-wide text-slate-400">
              PRESSURE STABLE
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="h-6 w-px bg-red-500/20" />

        {/* Warning Icon & "DON'T PRESS" Button Pill */}
        <button
          type="button"
          role="button"
          tabIndex={0}
          aria-label="Critical Atmosphere Emergency Override - Do Not Press"
          onClick={handleActivate}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false)
            setIsPressed(false)
          }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          className={`group relative flex h-7 items-center gap-1.5 rounded-lg border px-2.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer ${
            isPressed
              ? 'scale-95 border-red-700 bg-red-950 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)]'
              : isHovered
              ? 'scale-105 border-red-400 bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.8),inset_0_1px_2px_rgba(255,255,255,0.6)]'
              : 'border-red-500/80 bg-gradient-to-r from-red-700 via-red-600 to-red-700 shadow-[0_0_10px_rgba(239,68,68,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)]'
          }`}
        >
          {/* Pulsing Alert Icon */}
          <AlertOctagon className="h-3.5 w-3.5 text-white animate-pulse" />

          {/* Button Text */}
          <span className="font-sans text-[10px] font-black uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            DON&apos;T PRESS
          </span>
        </button>
      </div>
    </aside>
  )
}
