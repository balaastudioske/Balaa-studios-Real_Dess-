'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useAppStore } from '@/store/useAppStore'
import { StageHUD } from '@/components/ui/StageHUD'
import { createDefaultChoreography, loadSongChoreography } from '@/lib/performance-choreography'
import { BalaaStageInterface } from '@/components/ui/BalaaStageInterface'
import { REAL_DESS_MEDIA, type BalaaStageMode } from '@/lib/balaa-catalog'

const StageViewport = dynamic(() => import('@/components/3d/StageViewport').then((module) => module.StageViewport), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-neutral-950 font-mono text-xs text-orange-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
      <span className="font-bold tracking-widest animate-pulse">INITIALIZING BALAA STAGE…</span>
    </div>
  ),
})
const StageWardrobeBoards = dynamic(() => import('@/components/ui/StageWardrobeBoards').then((module) => module.StageWardrobeBoards))
const LicensingModal = dynamic(() => import('@/components/ui/LicensingModal').then((module) => module.LicensingModal))
const MerchDrawer = dynamic(() => import('@/components/ui/MerchDrawer').then((module) => module.MerchDrawer))

export default function Home() {
  const [activeMode, setActiveMode] = useState<BalaaStageMode>('catalog')
  const currentTrack = useAppStore((state) => state.currentTrack)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setPlaying = useAppStore((state) => state.setPlaying)
  const setAppMode = useAppStore((state) => state.setAppMode)
  const setPerformanceStartedAt = useAppStore((state) => state.setPerformanceStartedAt)
  const setActiveChoreography = useAppStore((state) => state.setActiveChoreography)
  const merchDrawerOpen = useAppStore((state) => state.merchDrawerOpen)
  const activeMediaId = useAppStore((state) => state.activeMediaId)
  const setActiveMediaId = useAppStore((state) => state.setActiveMediaId)
  const setCameraMode = useAppStore((state) => state.setCameraMode)
  const triggerCameraReset = useAppStore((state) => state.triggerCameraReset)

  const activeMediaIndex = Math.max(0, REAL_DESS_MEDIA.findIndex((item) => item.id === activeMediaId))
  const activeMedia = REAL_DESS_MEDIA[activeMediaIndex] || REAL_DESS_MEDIA[0]

  const togglePlay = () => {
    const next = !isPlaying
    setPlaying(next)
    setAppMode(next ? 'performing' : 'idle')
    setPerformanceStartedAt(next ? Date.now() : null)
    setActiveChoreography(next ? loadSongChoreography('shared-performance') || createDefaultChoreography('shared-performance') : null)
  }

  const setMode = (mode: BalaaStageMode) => {
    setActiveMode(mode)
    setCameraMode('artist')
    triggerCameraReset()
    if (!isPlaying) setAppMode('idle')
  }

  const selectTrack = (offset: number) => {
    const nextTrack = REAL_DESS_MEDIA[(activeMediaIndex + offset + REAL_DESS_MEDIA.length) % REAL_DESS_MEDIA.length]
    setActiveMediaId(nextTrack.id)
    setCameraMode('artist')
    triggerCameraReset()
  }

  return (
    <main className="relative h-screen w-screen select-none overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 z-0">
        <StageViewport activeMode={activeMode} onSetMode={setMode} />
      </div>
      <StageHUD
        activeMode={activeMode}
        onSetMode={setMode}
        currentTrackTitle={activeMedia?.title || currentTrack?.title || 'Real Des'}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onPrevious={() => selectTrack(-1)}
        onNext={() => selectTrack(1)}
      />
      <BalaaStageInterface activeMode={activeMode} onSetMode={setMode} />
      {activeMode === 'wardrobe' && <StageWardrobeBoards onClose={() => setMode('catalog')} />}
      {activeMode === 'licensing' && <LicensingModal onClose={() => setMode('catalog')} />}
      {merchDrawerOpen && <MerchDrawer />}
    </main>
  )
}
