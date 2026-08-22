import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useShallow } from 'zustand/react/shallow'
import * as THREE from 'three'
import { useAppStore } from '@/store/useAppStore'

export function usePerformanceSync(mixer?: THREE.AnimationMixer | null) {
  const { isPlaying, appMode, currentTrack, setCurrentTime } = useAppStore(useShallow((s) => ({
    isPlaying: s.isPlaying,
    appMode: s.appMode,
    currentTrack: s.currentTrack,
    setCurrentTime: s.setCurrentTime,
  })))

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  // Web Audio requires an ArrayBuffer-backed view; keeping that concrete type
  // avoids accepting SharedArrayBuffer data in the analyser call.
  const frequencyData = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(new ArrayBuffer(32)))

  useEffect(() => {
    if (!currentTrack?.url) return

    const audio = new Audio(currentTrack.url)
    audio.preload = 'auto'

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.5

    const source = audioContext.createMediaElementSource(audio)
    source.connect(analyser)
    analyser.connect(audioContext.destination)

    audioContextRef.current = audioContext
    analyserRef.current = analyser
    audioRef.current = audio

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      useAppStore.getState().setDuration(audio.duration)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.pause()
      source.disconnect()
      analyser.disconnect()
      audioContext.close()
    }
  }, [currentTrack, setCurrentTime])

  useFrame(({ clock }) => {
    if (!isPlaying || appMode !== 'performing') return

    if (audioRef.current && analyserRef.current) {
      analyserRef.current.getByteFrequencyData(frequencyData.current)
      let sum = 0
      for (let i = 0; i < 8; i++) {
        sum += frequencyData.current[i]
      }
      const bassEnergy = sum / (8 * 255)
      useAppStore.getState().setAudioPulse(bassEnergy)
    } else {
      // YouTube Embed Mode: Generate real-time BPM synchronized beat pulse
      const bpm = currentTrack?.bpm || 120
      const bps = bpm / 60
      const pulse = Math.pow(Math.max(0, Math.sin(clock.getElapsedTime() * Math.PI * bps)), 4) * 0.75
      useAppStore.getState().setAudioPulse(pulse)
    }
  })

  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying && appMode === 'performing') {
      audioRef.current.play().catch(() => {})
    } else if (!isPlaying) {
      audioRef.current.pause()
    }
  }, [isPlaying, appMode])

  return {
    frequencyData: frequencyData,
  }
}
