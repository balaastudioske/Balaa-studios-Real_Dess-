'use client'

import { useAppStore } from '@/store/useAppStore'
import { Music2 } from 'lucide-react'
import { ANIMATION_MAPPINGS, DANCE_ANIMATION_IDS, SINGING_ANIMATION_IDS } from '@/lib/animations'

const MOTIONS = Object.entries(ANIMATION_MAPPINGS).filter(([id]) => [...SINGING_ANIMATION_IDS, ...DANCE_ANIMATION_IDS].includes(id as never)).map(([id, animation]) => ({
  id,
  label: animation.clipName.replaceAll('_', ' '),
  icon: Music2,
}))

export const MotionPicker = () => {
  const sequenceStep = useAppStore((state) => state.sequenceStep)
  const setSequenceStep = useAppStore((state) => state.setSequenceStep)
  const setAppMode = useAppStore((state) => state.setAppMode)
  const setPlaying = useAppStore((state) => state.setPlaying)
  const setActiveChoreography = useAppStore((state) => state.setActiveChoreography)
  const setPerformanceStartedAt = useAppStore((state) => state.setPerformanceStartedAt)

  const selectMotion = (motionId: string) => {
    setSequenceStep(motionId)
    setAppMode('performing')
    setPlaying(true)
    // Manual previews stay at the current mark. Only a scheduled route or a
    // deliberate free-roam click is allowed to move the artist around stage.
    setPerformanceStartedAt(null)
    setActiveChoreography(null)
  }

  return (
    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
      <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#facc15]">Singing performance</p>
      <div className="grid grid-cols-2 gap-2">{MOTIONS.filter((motion) => (SINGING_ANIMATION_IDS as readonly string[]).includes(motion.id)).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => selectMotion(id)}
          className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 text-xs font-semibold transition-colors ${
            sequenceStep === id
              ? 'border-purple-400 bg-purple-500/25 text-purple-100'
              : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-purple-500/60 hover:bg-slate-800'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </button>
      ))}</div>
      <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#2dd4bf]">Dance cuts</p>
      <div className="grid grid-cols-2 gap-2">{MOTIONS.filter((motion) => (DANCE_ANIMATION_IDS as readonly string[]).includes(motion.id)).map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" onClick={() => selectMotion(id)} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-2 text-xs font-semibold transition-colors ${sequenceStep === id ? 'border-purple-400 bg-purple-500/25 text-purple-100' : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:border-purple-500/60 hover:bg-slate-800'}`}><Icon className="h-5 w-5" /><span>{label}</span></button>
      ))}</div>
    </div>
  )
}
