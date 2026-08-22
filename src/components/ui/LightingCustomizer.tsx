'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Sun, Lightbulb, Palette, RotateCcw, Save } from 'lucide-react'
import { useAppStore, type CustomLightingConfig } from '@/store/useAppStore'
import { MOOD_PRESETS, type MoodPreset } from '@/lib/sequences'

function getDefaultLighting(currentMood: string | null): CustomLightingConfig {
  const moodKey =
    currentMood && currentMood in MOOD_PRESETS
      ? (currentMood as MoodPreset)
      : 'blue-haze'
  const preset = MOOD_PRESETS[moodKey] || MOOD_PRESETS['blue-haze']

  return {
    keyLightColor: preset.keyLightColor || '#e879f9',
    keyLightIntensity: preset.keyLightEnergy ?? 1.0,
    ambientColor: preset.ambientColor || '#29152e',
    ambientIntensity: 0.5,
    neonColor: preset.neonColor || '#c026d3',
    neonIntensity: 1.0,
    fogColor: preset.fogColor || '#17101d',
    fogDensity: preset.fogDensity ?? 0.05,
  }
}

interface RangeSliderProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  digits?: number
  onChange: (v: number) => void
}

function RangeSlider({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.1,
  digits = 1,
  onChange,
}: RangeSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-right text-[11px] font-medium text-slate-400">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-700
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-fuchsia-400 [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
      />
      <span className="w-12 text-right font-mono text-[11px] text-fuchsia-300">
        {value.toFixed(digits)}
      </span>
    </div>
  )
}

interface ColorInputProps {
  label: string
  value: string
  onChange: (color: string) => void
}

function ColorInput({ label, value, onChange }: ColorInputProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase text-slate-400">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-0.5
            [&::-webkit-color-swatch-wrapper]:p-0
            [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-md
            [&::-moz-color-swatch]:border-0 [&::-moz-color-swatch]:rounded-md
            hover:border-fuchsia-500 transition-colors"
        />
      </div>
    </div>
  )
}

export const LightingCustomizer = () => {
  const { customLighting, setCustomLighting, currentMood } = useAppStore(
    useShallow((state) => ({
      customLighting: state.customLighting,
      setCustomLighting: state.setCustomLighting,
      currentMood: state.currentMood,
    }))
  )

  const [saved, setSaved] = useState(false)

  // On mount, load saved custom lighting from localStorage if present
  useEffect(() => {
    const stored = localStorage.getItem('dess_custom_lighting')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CustomLightingConfig
        if (
          parsed &&
          typeof parsed.keyLightColor === 'string' &&
          typeof parsed.keyLightIntensity === 'number' &&
          typeof parsed.ambientColor === 'string' &&
          typeof parsed.ambientIntensity === 'number' &&
          typeof parsed.neonColor === 'string' &&
          typeof parsed.neonIntensity === 'number' &&
          typeof parsed.fogColor === 'string' &&
          typeof parsed.fogDensity === 'number'
        ) {
          setCustomLighting(parsed)
        }
      } catch {
        /* ignore invalid data */
      }
    }
  }, [setCustomLighting])

  const activeLighting = useMemo(
    () => customLighting ?? getDefaultLighting(currentMood),
    [customLighting, currentMood]
  )

  const updateField = useCallback(
    <K extends keyof CustomLightingConfig>(key: K, value: CustomLightingConfig[K]) => {
      const updated: CustomLightingConfig = {
        ...activeLighting,
        [key]: value,
      }
      setCustomLighting(updated)
    },
    [activeLighting, setCustomLighting]
  )

  const handleSave = () => {
    localStorage.setItem('dess_custom_lighting', JSON.stringify(activeLighting))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setCustomLighting(null)
    localStorage.removeItem('dess_custom_lighting')
  }

  return (
    <div className="flex flex-col border-l border-slate-800 bg-slate-950 text-slate-100 h-full overflow-y-auto">
      {/* Header */}
      <div className="border-b border-slate-800 p-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-fuchsia-400">
          <Sun className="h-4 w-4" /> Lighting Customizer
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleSave}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-fuchsia-600 text-white hover:bg-fuchsia-500'
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            {saved ? 'Saved!' : 'Save Lighting'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to Mood
          </button>
        </div>
      </div>

      {/* Control Groups */}
      <div className="p-4 space-y-4">
        {/* Key Light Group */}
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sun className="h-3.5 w-3.5 text-fuchsia-400" /> Key Light
          </h3>
          <div className="rounded-lg bg-slate-900/50 p-3 ring-1 ring-slate-800 space-y-3">
            <ColorInput
              label="Key Light Color"
              value={activeLighting.keyLightColor}
              onChange={(color) => updateField('keyLightColor', color)}
            />
            <RangeSlider
              label="Intensity"
              value={activeLighting.keyLightIntensity}
              min={0}
              max={3}
              step={0.1}
              digits={1}
              onChange={(val) => updateField('keyLightIntensity', val)}
            />
          </div>
        </div>

        {/* Ambient Light Group */}
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-fuchsia-400" /> Ambient Light
          </h3>
          <div className="rounded-lg bg-slate-900/50 p-3 ring-1 ring-slate-800 space-y-3">
            <ColorInput
              label="Ambient Color"
              value={activeLighting.ambientColor}
              onChange={(color) => updateField('ambientColor', color)}
            />
            <RangeSlider
              label="Intensity"
              value={activeLighting.ambientIntensity}
              min={0}
              max={2}
              step={0.1}
              digits={1}
              onChange={(val) => updateField('ambientIntensity', val)}
            />
          </div>
        </div>

        {/* Neon Light Group */}
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-fuchsia-400" /> Neon Accents
          </h3>
          <div className="rounded-lg bg-slate-900/50 p-3 ring-1 ring-slate-800 space-y-3">
            <ColorInput
              label="Neon Color"
              value={activeLighting.neonColor}
              onChange={(color) => updateField('neonColor', color)}
            />
            <RangeSlider
              label="Intensity"
              value={activeLighting.neonIntensity}
              min={0}
              max={3}
              step={0.1}
              digits={1}
              onChange={(val) => updateField('neonIntensity', val)}
            />
          </div>
        </div>

        {/* Fog Group */}
        <div>
          <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-fuchsia-400" /> Atmospheric Fog
          </h3>
          <div className="rounded-lg bg-slate-900/50 p-3 ring-1 ring-slate-800 space-y-3">
            <ColorInput
              label="Fog Color"
              value={activeLighting.fogColor}
              onChange={(color) => updateField('fogColor', color)}
            />
            <RangeSlider
              label="Density"
              value={activeLighting.fogDensity}
              min={0}
              max={0.2}
              step={0.005}
              digits={3}
              onChange={(val) => updateField('fogDensity', val)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
