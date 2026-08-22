'use client'

import React from 'react'
import { Box, Layers, Cpu, CheckCircle2, ChevronRight, Eye, X } from 'lucide-react'
import { StageItemId } from '../3d/RealDessStageKit'
import { useAppStore } from '@/store/useAppStore'

export interface StageItemMetadata {
  id: StageItemId
  title: string
  category: 'Structure' | 'Audio' | 'Lighting' | 'Instruments' | 'Infrastructure'
  description: string
  polyCount: number
  materialType: string
  icon: string
}

export const STAGE_ITEMS: StageItemMetadata[] = [
  {
    id: 'main_stage',
    title: 'Main Stage',
    category: 'Structure',
    description: 'Raised heavy-duty concert deck with non-slip phenolic ply top and black flame-retardant skirting.',
    polyCount: 4200,
    materialType: 'Phenolic Deck / Steel Frame',
    icon: '🎪',
  },
  {
    id: 'truss_left',
    title: 'Truss Left',
    category: 'Structure',
    description: 'Heavy-duty 400mm aluminum quad box truss tower with steel outrigger baseplates and safety ballast.',
    polyCount: 8640,
    materialType: 'Aluminum 6082-T6',
    icon: '🏗️',
  },
  {
    id: 'truss_right',
    title: 'Truss Right',
    category: 'Structure',
    description: 'Symmetric right-side aluminum box truss tower supporting heavy line arrays and roof cantilevers.',
    polyCount: 8640,
    materialType: 'Aluminum 6082-T6',
    icon: '🏗️',
  },
  {
    id: 'top_truss',
    title: 'Top Truss & Banner',
    category: 'Structure',
    description: 'Horizontal roof truss span with matte black fascia board displaying "REAL DESS STAGE" header branding.',
    polyCount: 12400,
    materialType: 'Branded Fascia / Aluminum Frame',
    icon: '🏷️',
  },
  {
    id: 'speaker_left',
    title: 'Speaker Left',
    category: 'Audio',
    description: 'Curved 6-box concert line-array sound system hang with rigging flybars and high-SPL drivers.',
    polyCount: 16800,
    materialType: 'Birch Plywood / Polyurea Coat',
    icon: '🔊',
  },
  {
    id: 'speaker_right',
    title: 'Speaker Right',
    category: 'Audio',
    description: 'Right-flank 6-box line-array cluster providing wide horizontal audio dispersion across the audience lawn.',
    polyCount: 16800,
    materialType: 'Birch Plywood / Polyurea Coat',
    icon: '🔊',
  },
  {
    id: 'led_screen',
    title: 'LED Screen',
    category: 'Lighting',
    description: 'High-definition 11.5m x 5.5m outdoor stage video wall displaying the glowing Nairobi sunset skyline.',
    polyCount: 6500,
    materialType: 'P3.9 Outdoor LED Panels',
    icon: '🌇',
  },
  {
    id: 'stage_light',
    title: 'Stage Light',
    category: 'Lighting',
    description: 'High-output automated moving-head stage profile fixtures with motorized zoom and warm golden beam cones.',
    polyCount: 9200,
    materialType: 'Die-cast Aluminum / Optics',
    icon: '💡',
  },
  {
    id: 'par_light',
    title: 'Par Light',
    category: 'Lighting',
    description: 'RGBWA+UV LED wash fixtures mounted along the top roof truss for warm stage color floods.',
    polyCount: 7800,
    materialType: 'Anodized Black Metal',
    icon: '🔦',
  },
  {
    id: 'microphone',
    title: 'Microphone',
    category: 'Instruments',
    description: 'Lead vocal dynamic/condenser microphone on heavy round-base chrome stand positioned at stage center.',
    polyCount: 3400,
    materialType: 'Chrome Steel / Cast Iron',
    icon: '🎙️',
  },
  {
    id: 'drum_kit',
    title: 'Drum Kit',
    category: 'Instruments',
    description: 'Complete 5-piece concert acoustic drum set (kick, snare, toms, hi-hat, cymbals) on carpeted drum riser.',
    polyCount: 38400,
    materialType: 'Maple Shells / B20 Bronze',
    icon: '🥁',
  },
  {
    id: 'guitar_amp',
    title: 'Guitar Amp',
    category: 'Instruments',
    description: 'Dual Marshall-style stacked tube amplifier heads and 4x12 angled speaker cabinets on stage left.',
    polyCount: 14200,
    materialType: 'Black Tolex / Gold Faceplate',
    icon: '🎸',
  },
  {
    id: 'monitor_speaker',
    title: 'Monitor Speaker',
    category: 'Audio',
    description: 'Low-profile stage floor wedge monitor speakers angled at 45° toward the artist for pristine foldback.',
    polyCount: 5600,
    materialType: 'Textured Wood / Steel Grille',
    icon: '🔈',
  },
  {
    id: 'stage_platform',
    title: 'Stage Platform',
    category: 'Structure',
    description: 'Modular all-weather stage platform system with safety handrails and central front access stairs.',
    polyCount: 8900,
    materialType: 'Steel Truss / Marine Plywood',
    icon: '📐',
  },
  {
    id: 'barrier',
    title: 'Barrier',
    category: 'Infrastructure',
    description: 'Heavy-duty steel crowd control mojo/bike-rack barriers forming audience safety perimeter and aisles.',
    polyCount: 18200,
    materialType: 'Galvanized Steel Tube',
    icon: '🚧',
  },
  {
    id: 'tent',
    title: 'Tent',
    category: 'Infrastructure',
    description: 'White 5m peaked high-canopy event production and VIP hospitality tents on lawn flanks.',
    polyCount: 11400,
    materialType: 'PVC Membrane / Aluminum Frame',
    icon: '⛺',
  },
]

interface ItemInspectorBarProps {
  selectedItem: StageItemId | null
  onSelectItem: (id: StageItemId | null) => void
}

export const ItemInspectorBar: React.FC<ItemInspectorBarProps> = ({
  selectedItem,
  onSelectItem,
}) => {
  const hoveredMesh = useAppStore((s) => s.hoveredMesh)
  const setHoveredMesh = useAppStore((s) => s.setHoveredMesh)
  const setActiveCameraPreset = useAppStore((s) => s.setActiveCameraPreset)

  const selectedMeta = STAGE_ITEMS.find((item) => item.id === selectedItem)

  const handleCardClick = (id: StageItemId) => {
    if (selectedItem === id) {
      onSelectItem(null)
    } else {
      onSelectItem(id)
      // Focus camera based on item
      if (id === 'drum_kit' || id === 'guitar_amp') {
        setActiveCameraPreset('stage-full')
      } else if (id === 'microphone') {
        setActiveCameraPreset('close-up')
      } else if (id === 'barrier' || id === 'tent' || id === 'stage_platform') {
        setActiveCameraPreset('stage-3d')
      }
    }
  }

  return (
    <div className="w-full bg-[#0a0c14]/95 backdrop-blur-md border-t border-slate-800 text-white z-20">
      {/* Top Section Header */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-black text-xs uppercase tracking-widest">
            EVERY ITEM CLICKABLE
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            · Select any stage component to inspect 3D assets & PBR materials
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-amber-400" /> GLB 2.0
          </span>
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> 48 Objects
          </span>
          <span className="flex items-center gap-1">
            <Box className="w-3.5 h-3.5 text-fuchsia-400" /> 256,732 Polys
          </span>
        </div>
      </div>

      {/* 16-Item Horizontal Scrollable Strip matching Reference Image */}
      <div className="px-3 py-2.5 overflow-x-auto flex gap-2.5 scrollbar-thin scrollbar-thumb-slate-700">
        {STAGE_ITEMS.map((item) => {
          const isSelected = selectedItem === item.id
          const isHovered = hoveredMesh === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleCardClick(item.id)}
              onMouseEnter={() => setHoveredMesh(item.id)}
              onMouseLeave={() => setHoveredMesh(null)}
              className={`flex-shrink-0 w-28 p-2 rounded-lg border text-left transition-all duration-200 ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 shadow-lg shadow-amber-500/10'
                  : isHovered
                  ? 'bg-slate-800/80 border-cyan-400 text-slate-200'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="h-12 w-full bg-slate-950/80 rounded flex items-center justify-center text-xl mb-1.5 border border-slate-800/50">
                {item.icon}
              </div>
              <div className="text-[11px] font-bold truncate">{item.title}</div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider">
                {item.category}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected Item Detail Drawer */}
      {selectedMeta && (
        <div className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl p-2 bg-slate-950 rounded-lg border border-slate-800">
              {selectedMeta.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{selectedMeta.title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {selectedMeta.category}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                {selectedMeta.description}
              </p>
              <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-400">
                <span>Material: <b className="text-slate-200">{selectedMeta.materialType}</b></span>
                <span>Geometry: <b className="text-slate-200">{selectedMeta.polyCount.toLocaleString()} triangles</b></span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Production Ready
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={() => onSelectItem(null)}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
