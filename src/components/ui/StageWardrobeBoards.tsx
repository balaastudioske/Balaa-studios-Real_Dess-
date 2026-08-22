'use client'

import { Check, ChevronLeft, ChevronRight, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { WARDROBE_LOOKS } from './SpatialWardrobeShowroom'

export function StageWardrobeBoards({ onClose }: { onClose: () => void }) {
  const currentOutfit = useAppStore((state) => state.currentOutfit)
  const setOutfit = useAppStore((state) => state.setOutfit)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const currentIndex = Math.max(0, WARDROBE_LOOKS.findIndex((look) => look.id === currentOutfit))
  const currentLook = WARDROBE_LOOKS[currentIndex]

  const selectLook = (index: number) => {
    const next = (index + WARDROBE_LOOKS.length) % WARDROBE_LOOKS.length
    setOutfit(WARDROBE_LOOKS[next].id)
  }

  const order = () => {
    setOrderConfirmed(true)
    window.setTimeout(() => setOrderConfirmed(false), 2200)
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30" aria-label="Wardrobe View">
      {/* 1. Transparent Floating Metadata on the SIDE of GLB Avatar */}
      <aside className="pointer-events-none absolute left-6 md:left-20 top-1/2 -translate-y-1/2 max-w-sm p-4 text-white space-y-2 animate-in fade-in slide-in-from-left duration-300">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[.24em] text-[#2dd4bf] font-mono">
            BALAA WARDROBE • LOOK {currentLook.num}
          </p>
        </div>

        <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          {currentLook.title}
        </h1>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <span className="text-slate-300 uppercase tracking-wider">{currentLook.type}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">{currentLook.colorName}</span>
          <span className="text-slate-500">•</span>
          <span className="text-xl font-black text-[#facc15] font-mono">${currentLook.price}</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-xs pt-1">
          {currentLook.description}
        </p>

        <div className="pt-2 border-l-2 border-orange-500/80 pl-3">
          <p className="text-[9px] font-mono uppercase tracking-[.18em] text-orange-400/90">
            AUTHENTIC MASTER GARMENT • 100% HEAVYWEIGHT COTTON
          </p>
        </div>
      </aside>

      {/* 2. Floating Square Product Box in the Marked Right Stage Area */}
      <section className="pointer-events-auto absolute top-24 md:top-28 right-6 md:right-12 w-64 md:w-72 rounded-2xl border border-orange-500/40 bg-black/85 p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right duration-300">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1 text-slate-400 hover:bg-white/20 hover:text-white transition"
          aria-label="Close wardrobe"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Square Garment Image Preview */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-white/10 bg-neutral-950 flex items-center justify-center p-2">
          <img
            src={currentLook.refImage}
            alt={`${currentLook.title} preview`}
            className="h-full w-full object-contain rounded-lg"
          />
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 font-mono text-[9px] font-bold text-orange-400 border border-orange-400/30">
            {currentLook.num} / 10
          </span>
        </div>

        {/* Look Selector Strip & Controls */}
        <div className="mt-3 flex items-center justify-between gap-1">
          <button
            onClick={() => selectLook(currentIndex - 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/40 text-white hover:border-[#facc15] hover:text-[#facc15] transition active:scale-95"
            aria-label="Previous look"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 overflow-x-auto px-1 max-w-[140px] py-1">
            {WARDROBE_LOOKS.map((look, index) => (
              <button
                key={look.id}
                onClick={() => selectLook(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-6 bg-[#facc15]'
                    : 'w-2 bg-white/25 hover:bg-white/50'
                }`}
                aria-label={`Look ${look.num}`}
              />
            ))}
          </div>

          <button
            onClick={() => selectLook(currentIndex + 1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-black/40 text-white hover:border-[#facc15] hover:text-[#facc15] transition active:scale-95"
            aria-label="Next look"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Action Button */}
        <button
          onClick={order}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#facc15] to-[#f59e0b] py-2.5 text-center text-xs font-black uppercase tracking-[.14em] text-black hover:brightness-110 active:scale-[0.98] transition shadow-lg shadow-amber-500/20"
        >
          {orderConfirmed ? (
            <span className="flex items-center justify-center gap-1.5">
              <Check className="h-4 w-4" /> ADDED TO BAG
            </span>
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <ShoppingBag className="h-4 w-4" /> ORDER LOOK
            </span>
          )}
        </button>
      </section>
    </div>
  )
}
