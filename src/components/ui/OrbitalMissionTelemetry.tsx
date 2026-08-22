'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Radio, Compass, Orbit, Activity, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'

// Mission baseline anchor: BALAA Space Station launch epoch (or dynamic calculated epoch)
const MISSION_LAUNCH_EPOCH = new Date('2024-01-01T00:00:00Z').getTime()
const ORBITAL_PERIOD_MINUTES = 92.68 // Standard LEO orbital period in minutes (~15.54 orbits/day)

export function OrbitalMissionTelemetry() {
  const [mounted, setMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate mission days and orbital revolutions around Earth
  const { totalDays, dayFraction, totalOrbits, hours, minutes, seconds } = useMemo(() => {
    const elapsedMs = currentTime - MISSION_LAUNCH_EPOCH
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    const elapsedMinutes = elapsedMs / (1000 * 60)
    const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24)

    const orbits = elapsedMinutes / ORBITAL_PERIOD_MINUTES

    const d = Math.floor(elapsedDays)
    const frac = (elapsedDays - d).toFixed(4).substring(1) // .XXXX
    const h = String(Math.floor((elapsedSeconds % 86400) / 3600)).padStart(2, '0')
    const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')
    const s = String(elapsedSeconds % 60).padStart(2, '0')

    return {
      totalDays: d,
      dayFraction: frac,
      totalOrbits: orbits.toFixed(2),
      hours: h,
      minutes: m,
      seconds: s,
    }
  }, [currentTime])

  if (!mounted) return null

  return (
    <aside
      aria-label="Orbital Mission Telemetry"
      className="pointer-events-auto absolute top-4 right-4 z-40 max-w-xs select-none font-mono text-xs transition-all duration-300"
    >
      <div className="rounded-xl border border-orange-500/30 bg-black/85 p-3 text-slate-200 shadow-[0_0_30px_rgba(249,115,22,0.2)] backdrop-blur-xl">
        {/* Header / Primary Orbit Day Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
              ORBITAL METADATA
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 rounded border border-orange-500/30 bg-orange-950/40 px-1.5 py-0.5 text-[9px] text-orange-300 transition hover:bg-orange-900/60"
            title={isExpanded ? 'Collapse Telemetry' : 'Expand Telemetry'}
          >
            <span>{isExpanded ? 'COMPACT' : 'METRICS'}</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Primary Counter: Days Stage Has Orbited Earth */}
        <div className="mt-2.5 rounded-lg border border-orange-500/30 bg-neutral-950/90 p-2.5 text-center">
          <div className="text-[9px] font-bold uppercase tracking-wider text-orange-200/70 font-mono">
            TIME IN EARTH ORBIT
          </div>
          <div className="mt-0.5 text-base font-black text-amber-400 font-mono tracking-tight">
            DAY {totalDays.toLocaleString()}
            <span className="text-amber-300/80">{dayFraction}</span>
          </div>
          <div className="mt-0.5 text-[10px] text-amber-200/90 font-mono font-bold flex items-center justify-center gap-1.5">
            <span>T+ {hours}:{minutes}:{seconds}</span>
            <span className="text-orange-500/70">•</span>
            <span>{Number(totalOrbits).toLocaleString()} REVS</span>
          </div>
        </div>

        {/* Expanded Aerospace Telemetry Data */}
        {isExpanded && (
          <div className="mt-2.5 space-y-2 border-t border-orange-950/80 pt-2 text-[10.5px]">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded bg-neutral-900/80 p-1.5 border border-orange-900/40">
                <div className="text-[8.5px] uppercase text-slate-400 font-semibold">ALTITUDE</div>
                <div className="font-bold text-slate-200">418.4 KM</div>
                <div className="text-[8px] text-orange-400">LEO ORBIT</div>
              </div>
              <div className="rounded bg-neutral-900/80 p-1.5 border border-orange-900/40">
                <div className="text-[8.5px] uppercase text-slate-400 font-semibold">VELOCITY</div>
                <div className="font-bold text-slate-200">7.66 KM/S</div>
                <div className="text-[8px] text-amber-400">27,576 KM/H</div>
              </div>
            </div>

            <div className="space-y-1 rounded bg-neutral-900/60 p-2 text-[9.5px] border border-orange-900/30">
              <div className="flex justify-between">
                <span className="text-slate-400">Orbital Host:</span>
                <span className="font-bold text-amber-300">EARTH (Sector Alpha)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Axial Inclination:</span>
                <span className="text-slate-300">23.44°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Orbital Period:</span>
                <span className="text-slate-300">92.68 MIN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Solar System Node:</span>
                <span className="text-orange-300">SOL-3 / 8 PLANETS</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-amber-400/90 px-1 pt-0.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-orange-400" />
                STAGE SHUTTLE NOMINAL
              </span>
              <span className="text-slate-500">1361 W/m²</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
