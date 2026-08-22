'use client'

import React from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import type { BalaaStageMode } from '@/lib/balaa-catalog'

interface StageHUDProps {
  activeMode: BalaaStageMode
  onSetMode: (mode: BalaaStageMode) => void
  currentTrackTitle: string
  onTogglePlay: () => void
  onPrevious: () => void
  onNext: () => void
  isPlaying: boolean
}

export const StageHUD: React.FC<StageHUDProps> = ({
  currentTrackTitle,
  onTogglePlay,
  onPrevious,
  onNext,
  isPlaying,
}) => {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2">
      <div className="balaa-hud pointer-events-auto grid grid-cols-[2.5rem_1fr_4rem_2.5rem] items-center gap-2 px-2 py-2">
        <button
          onClick={onPrevious}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/45 text-slate-200 transition hover:border-[#facc15]/60 hover:text-[#facc15] active:scale-95"
          title="Previous track"
          aria-label="Previous track"
        >
          <SkipBack className="h-4 w-4 fill-current" />
        </button>
        <div className="min-w-0 px-1">
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f97316]">Now performing</p>
          <h1 className="truncate text-sm font-black uppercase tracking-[.08em] text-white">
            {currentTrackTitle}
          </h1>
        </div>
        <button
          onClick={onTogglePlay}
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-black shadow-[0_0_28px_rgba(249,115,22,.4)] transition-all active:scale-95 ${
            isPlaying
              ? 'bg-[#facc15] hover:bg-[#fde047]'
              : 'bg-[#f97316] hover:bg-[#fb923c]'
          }`}
          title={isPlaying ? 'Pause Performance' : 'Start Performance'}
          aria-label={isPlaying ? 'Pause Performance' : 'Start Performance'}
        >
          {isPlaying ? <Pause className="h-7 w-7 fill-black" /> : <Play className="ml-1 h-7 w-7 fill-black" />}
        </button>
        <button
          onClick={onNext}
          className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/45 text-slate-200 transition hover:border-[#facc15]/60 hover:text-[#facc15] active:scale-95"
          title="Next track"
          aria-label="Next track"
        >
          <SkipForward className="h-4 w-4 fill-current" />
        </button>
      </div>
    </div>
  )
}
