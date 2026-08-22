import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/useAppStore'
import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StepRateConfig {
  [key: string]: { step: number; offset?: number }
}

export const useVariableFrameStepping = (mixer: THREE.AnimationMixer, configs: StepRateConfig) => {
  const { isPlaying, appMode } = useAppStore(useShallow((s) => ({
    isPlaying: s.isPlaying,
    appMode: s.appMode,
  })))

  // Track last update time per config
  const lastUpdate = useRef<Record<string, number>>({})
  const frameCount = useRef(0)

  useFrame(({ clock }) => {
    if (!mixer || !isPlaying || appMode !== 'performing') return

    frameCount.current += 1

    // For stepped animation, we delay updating each object based on its step rate
    Object.entries(configs).forEach(([key, config]) => {
      const { step, offset = 0 } = config
      const now = clock.elapsedTime

      if (!lastUpdate.current[key]) {
        lastUpdate.current[key] = now
      }

      const elapsed = now - lastUpdate.current[key]
      const targetDt = 1 / (60 / step)  // 60fps / step rate

      if (elapsed >= targetDt) {
        // Advance this object's animation
        lastUpdate.current[key] = now - (elapsed % targetDt)

        // Could trigger per-object animation updates here
        // For now, the mixer runs at full speed; stepping is applied
        // to specific node transforms via the SteppedInterpolation component
      }
    })
  })

  return { frameCount }
}

// Stepped keyframe interpolation for animation tracks
export function applySteppedKeyframes(
  track: THREE.NumberKeyframeTrack | THREE.VectorKeyframeTrack | THREE.QuaternionKeyframeTrack,
  stepRate: number
): void {
  if (stepRate <= 1) return

  const times = track.times
  const values = track.values

  // Hold each keyframe for stepRate frames
  const newTimes: number[] = []
  const newValues: any[] = []

  for (let i = 0; i < times.length; i++) {
    const holdDuration = (1 / 60) * stepRate
    for (let j = 0; j < stepRate; j++) {
      newTimes.push(times[i])
      if (track instanceof THREE.NumberKeyframeTrack) {
        newValues.push(values[i])
      } else {
        newValues.push(values[i * (track.getValueSize ? track.getValueSize() : 1)])
      }
    }
  }

  track.times = new Float32Array(newTimes)
  track.values = new Float32Array(newValues as number[])
}