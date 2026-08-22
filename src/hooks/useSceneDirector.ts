import { useCallback, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AudioTrack } from '@/types/tracks'
import { loadSongChoreography } from '@/lib/performance-choreography'
import { sleep } from '@/lib/utils'

export function useSceneDirector() {
  const cancelled = useRef(false)

  const runSequence = useCallback(async (track: AudioTrack) => {
    cancelled.current = false
    const {
      setAppMode,
      setCameraMode,
      setMood,
      setOutfit,
      setEnvironment,
      setSequenceStep,
      setActiveCameraPreset,
      setTrack,
      setPlaying,
      setCurrentTime,
      setActiveChoreography,
      setPerformanceStartedAt,
    } = useAppStore.getState()

    const choreography = loadSongChoreography(track.id)
    setAppMode('sequence')
    setCameraMode('artist')
    setMood(track.mood)
    setOutfit(track.outfitPreset)
    setEnvironment(track.environmentPreset)
    setActiveChoreography(choreography)

    await sleep(200)

    for (const step of track.introSequence) {
      if (cancelled.current) return
      setSequenceStep(step.animationClip)
      if (step.cameraPreset) setActiveCameraPreset(step.cameraPreset)
      await sleep(step.durationMs)
    }

    if (cancelled.current) return
    const performanceStartedAt = Date.now()
    setPerformanceStartedAt(performanceStartedAt)
    setAppMode('performing')
    setCameraMode('artist')
    setTrack(track)
    setPlaying(true)
    setSequenceStep(null)

    const performanceBudgetMs = Math.max(0, track.duration * 1000 - track.introSequence.reduce((total, step) => total + step.durationMs, 0))

    while (!cancelled.current) {
      const elapsedMs = Date.now() - performanceStartedAt
      if (elapsedMs >= performanceBudgetMs) break
      setCurrentTime(elapsedMs / 1000)
      await sleep(200)
    }

    if (!cancelled.current) {
      setPlaying(false)
      setCurrentTime(0)
      setSequenceStep('idle_a')
      setAppMode('idle')
      setCameraMode('artist')
      setPerformanceStartedAt(null)
      setActiveChoreography(null)
    }
  }, [])

  const cancel = useCallback(() => {
    cancelled.current = true
    const { setPlaying, setSequenceStep, setAppMode, setCameraMode, setCurrentTime, setPerformanceStartedAt, setActiveChoreography } = useAppStore.getState()
    setPlaying(false)
    setCurrentTime(0)
    setSequenceStep('idle_a')
    setAppMode('idle')
    setCameraMode('artist')
    setPerformanceStartedAt(null)
    setActiveChoreography(null)
  }, [])

  return { runSequence, cancel }
}
