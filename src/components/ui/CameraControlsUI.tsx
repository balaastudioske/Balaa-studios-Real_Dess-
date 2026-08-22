'use client'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/useAppStore'
import { CameraPreset } from '@/types'

const CAMERA_PRESET_LABELS: Record<CameraPreset, string> = {
  'stage-full': 'Stage Full',
  'stage-wide': 'Stage Wide',
  front: 'Front Performer',
  'stage-left': 'Stage Left',
  'stage-right': 'Stage Right',
  'artist-medium': 'Artist Medium',
  'close-up': 'Close-Up',
  'artist-close': 'Artist Close',
  'over-shoulder': 'Over Shoulder',
  crowd: 'Crowd Angle',
  audience: 'Audience Pit',
  'free-orbit': 'Free Orbit',
  'stage-3d': 'Stage 3D View',
  'top-view': 'Top View (Layout)',
}

export const CameraControlsUI = () => {
  const { activeCameraPreset, setActiveCameraPreset } = useAppStore(useShallow((s) => ({
    activeCameraPreset: s.activeCameraPreset,
    setActiveCameraPreset: s.setActiveCameraPreset,
  })))

  return (
    <div className="flex flex-wrap gap-1.5 p-3 bg-slate-900/80 border-t border-slate-700">
      {(Object.keys(CAMERA_PRESET_LABELS) as CameraPreset[]).map((preset) => (
        <button
          key={preset}
          onClick={() => setActiveCameraPreset(preset)}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all
            ${activeCameraPreset === preset
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
          `}
        >
          {CAMERA_PRESET_LABELS[preset]}
        </button>
      ))}
    </div>
  )
}