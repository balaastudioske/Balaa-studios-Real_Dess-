'use client'

import { RotateCcw, RotateCw, Undo2, X } from 'lucide-react'
import { useStageLayoutStore } from '@/store/useStageLayoutStore'

export function StageLayoutEditor({ onClose }: { onClose: () => void }) {
  const items = useStageLayoutStore((s) => s.items)
  const selectedId = useStageLayoutStore((s) => s.selectedId)
  const select = useStageLayoutStore((s) => s.select)
  const nudge = useStageLayoutStore((s) => s.nudge)
  const resize = useStageLayoutStore((s) => s.resize)
  const rotate = useStageLayoutStore((s) => s.rotate)
  const reset = useStageLayoutStore((s) => s.reset)
  const selected = items[selectedId]
  const Action = ({ label, action }: { label: string; action: () => void }) => <button onClick={action} className="balaa-tool-button w-full rounded-md px-2 py-2 text-[10px]">{label}</button>
  return <section className="balaa-panel pointer-events-auto absolute bottom-28 left-4 z-40 w-[min(20rem,90vw)] p-3 text-white"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-[#facc15]">Stage arrangement</p><h2 className="text-sm font-black">{selected?.label}</h2></div><button onClick={onClose} className="rounded p-1 text-slate-300 hover:bg-white/10"><X className="h-4 w-4" /></button></div><select value={selectedId} onChange={(event) => select(event.target.value)} className="mt-3 w-full rounded-lg border border-white/15 bg-black px-2 py-2 text-xs text-white">{Object.values(items).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><div className="mt-3 grid grid-cols-3 gap-1 text-center"><Action label="←" action={() => nudge(0, -0.2)} /><Action label="Forward" action={() => nudge(2, -0.2)} /><Action label="→" action={() => nudge(0, 0.2)} /><Action label="Down" action={() => nudge(1, -0.1)} /><Action label="Back" action={() => nudge(2, 0.2)} /><Action label="Up" action={() => nudge(1, 0.1)} /></div><div className="mt-2 grid grid-cols-3 gap-2"><button onClick={() => resize(-0.1)} className="balaa-tool-button text-[10px]">Smaller</button><span className="grid place-items-center text-[10px] font-bold text-[#facc15]">{selected?.targetHeight.toFixed(2)}m</span><button onClick={() => resize(0.1)} className="balaa-tool-button text-[10px]">Larger</button></div><div className="mt-2 flex gap-2"><button onClick={() => rotate(-0.12)} className="balaa-tool-button flex flex-1 text-[10px]"><RotateCcw className="h-3 w-3" />Rotate</button><button onClick={() => rotate(0.12)} className="balaa-tool-button flex flex-1 text-[10px]">Rotate<RotateCw className="h-3 w-3" /></button><button onClick={reset} className="balaa-tool-button px-2" title="Reset stage layout"><Undo2 className="h-3 w-3" /></button></div><p className="mt-2 text-[9px] text-slate-400">Select a prop or garment in the stage, then nudge, resize, raise, lower or rotate it.</p></section>
}
