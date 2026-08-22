'use client'
import { useAppStore } from '@/store/useAppStore'
import { RenderMode } from '@/types'
import { useShallow } from 'zustand/react/shallow'
import { Palette, Film, Sparkles, Layers, Eye, Sparkle } from 'lucide-react'

const RENDER_MODE_LABELS: Record<RenderMode, { label: string; desc: string; icon: React.ReactNode }> = {
  'balaa-hybrid': { label: 'BALAA Hybrid (Master)', desc: 'PBR Textures + Toon Light + Outlines + Halftone', icon: <Sparkle className="w-3.5 h-3.5 text-orange-400" /> },
  'pbr-only': { label: '1. PBR Only', desc: 'Raw standard physically-based rendering', icon: <Eye className="w-3.5 h-3.5" /> },
  'pbr-toon': { label: '2. PBR + Toon Light', desc: 'Preserved PBR with stepped light bands', icon: <Layers className="w-3.5 h-3.5 text-yellow-400" /> },
  'pbr-toon-outline': { label: '3. PBR + Toon + Outline', desc: 'Toon lighting with selective ink outlines', icon: <Palette className="w-3.5 h-3.5 text-blue-400" /> },
  'pbr-toon-halftone': { label: '4. PBR + Toon + Halftone', desc: 'Toon lighting with Ben-Day shadow dots', icon: <Film className="w-3.5 h-3.5 text-purple-400" /> },
  'npr-anime': { label: 'Anime Graphic', desc: 'Higher contrast comic book look', icon: <Palette className="w-3.5 h-3.5 text-pink-400" /> },
  'npr-story': { label: 'Story Cinematic', desc: 'Warm cinematic stylized grade', icon: <Film className="w-3.5 h-3.5 text-amber-400" /> },
  'particles': { label: 'Glow Particles', desc: 'Audio reactive particle matrix', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
}

export const RenderModeToggle = () => {
  const { renderMode, setRenderMode } = useAppStore(
    useShallow((s) => ({
      renderMode: s.renderMode,
      setRenderMode: s.setRenderMode,
    }))
  )

  return (
    <div className="flex flex-col gap-1 p-2 bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-xl max-w-xs">
      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 px-2 py-1 border-b border-slate-800">
        Rendering Engine Mode
      </div>
      <div className="space-y-0.5 max-h-64 overflow-y-auto pt-1">
        {Object.entries(RENDER_MODE_LABELS).map(([mode, config]) => (
          <button
            key={mode}
            onClick={() => setRenderMode(mode as RenderMode)}
            className={`
              w-full flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition-all
              ${renderMode === mode
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50 shadow-sm'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'}
            `}
          >
            <span className="mt-0.5 shrink-0">{config.icon}</span>
            <div className="min-w-0">
              <div className="text-xs font-mono font-bold truncate">{config.label}</div>
              <div className="text-[9px] text-slate-500 truncate leading-tight">{config.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
