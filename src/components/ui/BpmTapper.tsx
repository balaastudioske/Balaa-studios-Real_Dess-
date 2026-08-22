'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Activity, RotateCcw } from 'lucide-react'

interface BpmTapperProps {
  onBpmCalculated?: (bpm: number) => void
  initialBpm?: number
}

export const BpmTapper: React.FC<BpmTapperProps> = ({
  onBpmCalculated,
  initialBpm = 120,
}) => {
  const [bpm, setBpm] = useState<number>(initialBpm)
  const [taps, setTaps] = useState<number[]>([])
  const [isTapping, setIsTapping] = useState(false)
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleTap = () => {
    const now = performance.now()
    setIsTapping(true)

    // Reset indicator animation
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current)
    tapTimeoutRef.current = setTimeout(() => setIsTapping(false), 150)

    setTaps((prev) => {
      // Keep only taps within the last 3 seconds to avoid stale calculations
      const newTaps = [...prev, now].filter((t) => now - t < 3000)

      if (newTaps.length > 1) {
        // Calculate intervals
        const intervals: number[] = []
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1])
        }

        // Average interval in milliseconds
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
        // Calculate BPM (60,000ms in a minute)
        const calculatedBpm = Math.round(60000 / avgInterval)

        if (calculatedBpm >= 40 && calculatedBpm <= 240) {
          setBpm(calculatedBpm)
          if (onBpmCalculated) {
            onBpmCalculated(calculatedBpm)
          }
        }
      }

      return newTaps
    })
  }

  const handleReset = () => {
    setTaps([])
    setBpm(initialBpm)
  }

  // Keyboard shortcut listener ('t' or 'Space')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return
      }

      if (e.key === ' ' || e.key.toLowerCase() === 't') {
        e.preventDefault()
        handleTap()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current)
    }
  }, [onBpmCalculated])

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-[0.15em] text-fuchsia-400 flex items-center gap-2">
          <Activity className="w-4 h-4 animate-pulse text-fuchsia-500" /> BPM Calibrator
        </h4>
        <button
          onClick={handleReset}
          className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Reset taps"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-6 py-2">
        <div className="text-center">
          <div className="text-4xl font-mono font-black text-slate-100 tracking-tight">
            {bpm || '---'}
          </div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">
            Est. BPM
          </div>
        </div>

        <div className="h-10 w-[1px] bg-slate-800" />

        <div className="text-center">
          <div className="text-xl font-mono font-bold text-fuchsia-300">
            {taps.length}
          </div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-2">
            Taps
          </div>
        </div>
      </div>

      <button
        onClick={handleTap}
        className={`w-full py-4 px-6 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border select-none
          ${isTapping
            ? 'bg-fuchsia-500 text-white border-fuchsia-400 scale-[0.98]'
            : 'bg-slate-800 hover:bg-slate-700/80 text-slate-200 border-slate-700 hover:border-slate-600 active:scale-95'
          }
        `}
      >
        TAP HERE OR PRESS [SPACE]
      </button>

      <p className="text-[10px] text-slate-500 text-center font-medium leading-relaxed">
        Tap at least 4 times in rhythm with the music to calibrate the BPM.
      </p>
    </div>
  )
}
