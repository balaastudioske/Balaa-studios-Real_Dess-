'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Check, ArrowRight, X } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

export interface WardrobeLook {
  id: string
  num: string
  title: string
  type: string
  colorName: string
  colorHex: string
  price: number
  description: string
  garmentModel: string
  refImage: string
  tripoModel?: string
  matchConfidence: 'confirmed' | 'review-needed'
}

export const WARDROBE_LOOKS: WardrobeLook[] = [
  {
    id: 'look_01',
    num: '01',
    title: 'BALAA Signature Oversized Tee',
    type: 'Heavyweight Tee',
    colorName: 'Charcoal Wash',
    colorHex: '#2B2B2B',
    price: 120,
    description: 'Custom 280 GSM heavyweight French terry cotton with relaxed drop shoulders and embossed BALAA chest wordmark.',
    garmentModel: '/library/merch/01/garment.glb',
    refImage: '/library/clothes/cloth_01.jpeg',
    tripoModel: '/library/wardrobe/tripo/athletic-human-3d-model/tripo_convert_5ad2a556-90d1-46c8-9818-e8f8f3542b9c.fbx', matchConfidence: 'review-needed',
  },
  {
    id: 'look_02',
    num: '02',
    title: 'BALAA Obsidian Boxy Hoodie',
    type: 'Embroidered Hoodie',
    colorName: 'Jet Black',
    colorHex: '#0A0A0A',
    price: 160,
    description: 'Double-lined 460 GSM organic cotton hoodie with tonal high-density BALAA embroidery across the chest.',
    garmentModel: '/library/merch/02/garment.glb',
    refImage: '/library/clothes/cloth_02.jpeg',
    tripoModel: '/library/wardrobe/tripo/man-in-hoodie-3d-model/tripo_convert_3a2ae9ab-95ea-4195-aa37-f9a8813c67e1.fbx', matchConfidence: 'confirmed',
  },
  {
    id: 'look_03',
    num: '03',
    title: 'BALAA Mineral Crewneck Sweater',
    type: 'Knit Crewneck',
    colorName: 'Charcoal Mineral',
    colorHex: '#2B2B2B',
    price: 145,
    description: 'Vintage mineral wash relaxed crewneck with ribbed cuffs and subtle tonal silicone branding.',
    garmentModel: '/library/merch/03/garment.glb',
    refImage: '/library/clothes/cloth_03.jpeg',
    tripoModel: '/library/wardrobe/tripo/human-character-3d-model/tripo_convert_53b8c737-4904-4153-8ff8-e856ade9b36e.fbx', matchConfidence: 'review-needed',
  },
  {
    id: 'look_04',
    num: '04',
    title: 'BALAA Studio Essential White Tee',
    type: 'Classic Cut Tee',
    colorName: 'Pure White',
    colorHex: '#FFFFFF',
    price: 120,
    description: 'Crisp optical white tee with black silkscreen BALAA typographic logo centered on chest.',
    garmentModel: '/library/merch/04/garment.glb',
    refImage: '/library/clothes/cloth_04.jpeg',
    tripoModel: '/library/wardrobe/tripo/human-character-3d-model-2-/tripo_convert_378612f3-b788-41d8-8a01-e7f234541b44.fbx', matchConfidence: 'review-needed',
  },
  {
    id: 'look_05',
    num: '05',
    title: 'BALAA Tour Oversized Pullover',
    type: 'Heavy Hoodie',
    colorName: 'Vintage Charcoal',
    colorHex: '#2B2B2B',
    price: 165,
    description: 'Oversized boxy streetwear hoodie with exaggerated hood drape and rubberized sleeve patches.',
    garmentModel: '/library/merch/05/garment.glb',
    refImage: '/library/clothes/cloth_05.jpeg',
    tripoModel: '/library/wardrobe/tripo/human-figure-3d-model/tripo_convert_07ef2f22-9dd4-4ef3-8198-24e34216d42f.fbx', matchConfidence: 'review-needed',
  },
  {
    id: 'look_06',
    num: '06',
    title: 'BALAA Sandstone Crew Sweater',
    type: 'Warm Knit',
    colorName: 'Alabaster Cream',
    colorHex: '#F5F0E8',
    price: 150,
    description: 'Alabaster cream heavy cotton fleece with contrast black gothic BALAA chest embroidery.',
    garmentModel: '/library/merch/06/garment.glb',
    refImage: '/library/clothes/cloth_06.jpeg',
    tripoModel: '/library/wardrobe/tripo/human-figure-3d-model-1-/tripo_convert_ed068fe9-ebf2-4fc7-8c2e-e1715774a2d2.fbx', matchConfidence: 'review-needed',
  },
  {
    id: 'look_07',
    num: '07',
    title: 'BALAA Monolith Black Tee',
    type: 'Graphic Tee',
    colorName: 'Jet Black',
    colorHex: '#0A0A0A',
    price: 120,
    description: 'Solid pitch-black luxury cotton tee featuring reverse high-contrast white BALAA studio glyph.',
    garmentModel: '/library/merch/07/garment.glb',
    refImage: '/library/clothes/cloth_07.jpeg',
    tripoModel: '/library/wardrobe/tripo/human-figure-3d-model-2-/tripo_convert_ea2eb220-daf6-42f9-9a28-34ead333505b.fbx', matchConfidence: 'review-needed',
  },
  {
    id: 'look_08',
    num: '08',
    title: 'BALAA Pure Alabaster Hoodie',
    type: 'White Hoodie',
    colorName: 'Optical White',
    colorHex: '#FFFFFF',
    price: 160,
    description: 'Pure white structured hoodie with ribbed drop hem, matte silver eyelets, and tonal silicone crest.',
    garmentModel: '/library/merch/08/garment.glb',
    refImage: '/library/clothes/cloth_08.jpeg',
    tripoModel: '/library/wardrobe/tripo/person-wearing-hoodie-3d-model/tripo_convert_68ca7539-9776-4052-b07c-e6b71ce37b4c.fbx', matchConfidence: 'confirmed',
  },
  {
    id: 'look_09',
    num: '09',
    title: 'BALAA Stealth Black Crewneck',
    type: 'Minimalist Crew',
    colorName: 'Midnight Black',
    colorHex: '#0A0A0A',
    price: 145,
    description: 'Ultra-clean stealth black crewneck sweatshirt with micro-rib collar and brushed interior.',
    garmentModel: '/library/merch/09/garment.glb',
    refImage: '/library/clothes/cloth_09.jpeg',
    tripoModel: '/library/wardrobe/tripo/stylized-human-figure-3d-model/tripo_convert_21f2e4c3-4efa-4f45-bc2b-66be3ba85093.fbx', matchConfidence: 'review-needed',
  },
  {
    id: 'look_10',
    num: '10',
    title: 'BALAA Runway Bomber Jacket',
    type: 'Streetwear Bomber',
    colorName: 'Dark Charcoal',
    colorHex: '#1E1E1E',
    price: 195,
    description: 'Heavyweight streetwear bomber jacket with custom ribbed stand collar, storm flap, and oversized back print.',
    garmentModel: '/library/merch/10/garment.glb',
    refImage: '/library/clothes/cloth_10.jpeg',
    tripoModel: '/library/wardrobe/tripo/man-in-hoodie-3d-model/tripo_convert_3a2ae9ab-95ea-4195-aa37-f9a8813c67e1.fbx', matchConfidence: 'confirmed',
  },
]

interface SpatialWardrobeShowroomProps {
  onClose: () => void
}

export const SpatialWardrobeShowroom: React.FC<SpatialWardrobeShowroomProps> = ({ onClose }) => {
  const currentOutfit = useAppStore((s) => s.currentOutfit)
  const setOutfit = useAppStore((s) => s.setOutfit)
  const setActiveCameraPreset = useAppStore((s) => s.setActiveCameraPreset)

  const activeIndex = Math.max(
    0,
    WARDROBE_LOOKS.findIndex((l) => l.id === (currentOutfit || 'look_02'))
  )
  const [currentIndex, setCurrentIndex] = useState(activeIndex)
  const [orderConfirmed, setOrderConfirmed] = useState(false)

  const currentLook = WARDROBE_LOOKS[currentIndex]

  const handleSelectLook = (index: number) => {
    const newIdx = (index + WARDROBE_LOOKS.length) % WARDROBE_LOOKS.length
    setCurrentIndex(newIdx)
    const look = WARDROBE_LOOKS[newIdx]
    setOutfit(look.id)
    setActiveCameraPreset('close-up')
  }

  const handleBuy = () => {
    setOrderConfirmed(true)
    setTimeout(() => setOrderConfirmed(false), 3000)
  }

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {/* Left / Center Spatial Navigation Arrows */}
      <div className="pointer-events-auto absolute left-[6%] top-[42%]">
        <button
          onClick={() => handleSelectLook(currentIndex - 1)}
          className="p-3.5 rounded-full bg-black/70 hover:bg-amber-500 hover:text-black text-white border border-slate-700/80 backdrop-blur-md transition-all shadow-xl hover:scale-110"
          aria-label="Previous Look"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Right Side: Sleek NFS Garage Product Showroom Card */}
      <div className="pointer-events-auto absolute left-1/2 top-[28%] w-[min(28rem,37vw)] -translate-x-1/2 bg-[#0a0c14]/80 border border-slate-700/80 backdrop-blur-xl rounded-xl p-3 text-white shadow-2xl space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
              BALAA VIRTUAL SHOWROOM · LOOK {currentLook.num} OF 10
            </span>
            <h2 className="text-xl font-black mt-1 text-white leading-tight">
              {currentLook.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-slate-300">{currentLook.type}</span>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-amber-400 font-bold">${currentLook.price} USD</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Reference Product Photo */}
        <div className="relative h-24 w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
          <img
            src={currentLook.refImage}
            alt={currentLook.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[9px] font-bold text-slate-200 border border-slate-700/60 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Reference Asset
          </div>
          <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-amber-500 text-black font-extrabold text-xs rounded-full shadow-lg">
            ${currentLook.price}
          </div>
        </div>

        {/* Description & Color Swatch */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {currentLook.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-full border-2 border-slate-500 shadow-inner"
              style={{ backgroundColor: currentLook.colorHex }}
            />
            <span className="text-xs text-slate-300 font-medium">{currentLook.colorName}</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Fitted to Real Des
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleBuy}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            {orderConfirmed ? (
              <>
                <Check className="w-4 h-4" /> Added to Bag
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" /> Order Look {currentLook.num} · ${currentLook.price}
              </>
            )}
          </button>
        </div>

        {/* Look Thumbnails Bar */}
        <div className="flex gap-1.5 overflow-x-auto pt-2 scrollbar-none">
          {WARDROBE_LOOKS.map((look, idx) => (
            <button
              key={look.id}
              onClick={() => handleSelectLook(idx)}
              className={`flex-shrink-0 w-8 h-8 rounded-lg border text-[11px] font-bold transition-all ${
                currentIndex === idx
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 scale-110'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600'
              }`}
            >
              {look.num}
            </button>
          ))}
        </div>
      </div>

      {/* Right Arrow */}
      <div className="pointer-events-auto absolute right-[6%] top-[42%]">
        <button
          onClick={() => handleSelectLook(currentIndex + 1)}
          className="p-3.5 rounded-full bg-black/70 hover:bg-amber-500 hover:text-black text-white border border-slate-700/80 backdrop-blur-md transition-all shadow-xl hover:scale-110"
          aria-label="Next Look"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}
