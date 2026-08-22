import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RHUBARB_TO_ARKIT, LipSyncData, MouthCue } from '@/lib/lipSyncMapping'

export function useAvatarLipSync(
  mixer: THREE.AnimationMixer | undefined,
  avatarGroup: THREE.Group | null,
  trackId: string | null,
  isPlaying: boolean
) {
  const [lipSyncData, setLipSyncData] = useState<LipSyncData | null>(null)
  const faceMeshesRef = useRef<THREE.SkinnedMesh[]>([])

  // Load lip-sync cues when the track changes
  useEffect(() => {
    if (!trackId) {
      setLipSyncData(null)
      return
    }

    let isMounted = true
    const jsonUrl = `/library/songs/${trackId}.json`

    fetch(jsonUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`LipSync JSON not found for ${trackId}`)
        }
        return res.json()
      })
      .then((data) => {
        if (isMounted) {
          setLipSyncData(data)
          console.log(`[LipSync] Loaded cues for ${trackId}:`, data.mouthCues?.length)
        }
      })
      .catch((err) => {
        console.warn(`[LipSync] Could not load lip sync JSON from ${jsonUrl}:`, err.message)
        if (isMounted) setLipSyncData(null)
      })

    return () => {
      isMounted = false
    }
  }, [trackId])

  // Cache face meshes that contain the required morph targets
  useEffect(() => {
    if (!avatarGroup) return
    const meshes: THREE.SkinnedMesh[] = []
    avatarGroup.traverse((child: any) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary && child.morphTargetInfluences) {
        // Specifically look for meshes containing facial blendshapes like jawOpen
        if ('jawOpen' in child.morphTargetDictionary) {
          meshes.push(child)
        }
      }
    })
    faceMeshesRef.current = meshes
    console.log(`[LipSync] Cached ${meshes.length} face meshes with morph targets.`)
  }, [avatarGroup])

  const resetDoneRef = useRef(false)

  useFrame((_, delta) => {
    if (!isPlaying || !mixer || !lipSyncData || faceMeshesRef.current.length === 0) {
      if (resetDoneRef.current) return
      // If not playing, or no data, smoothly reset morph targets to 0 once
      let allZero = true
      faceMeshesRef.current.forEach((mesh) => {
        const dict = mesh.morphTargetDictionary!
        const influences = mesh.morphTargetInfluences!
        Object.keys(dict).forEach((key) => {
          if (key.startsWith('jaw') || key.startsWith('mouth')) {
            const idx = dict[key]
            influences[idx] = THREE.MathUtils.lerp(influences[idx], 0, 0.3)
            if (influences[idx] > 0.005) allZero = false
            else influences[idx] = 0
          }
        })
      })
      if (allZero) resetDoneRef.current = true
      return
    }
    resetDoneRef.current = false

    const time = mixer.time
    const cues = lipSyncData.mouthCues

    // Binary search or linear search for active cue
    let activeCue: MouthCue | null = null
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i]
      if (time >= cue.start && time <= cue.end) {
        activeCue = cue
        break
      }
    }

    // Get target shapes based on active cue, default to silent 'X'
    const targetShapes = activeCue ? RHUBARB_TO_ARKIT[activeCue.value] : RHUBARB_TO_ARKIT['X']
    if (!targetShapes) return

    // Apply target weights to all cached face meshes
    faceMeshesRef.current.forEach((mesh) => {
      const dict = mesh.morphTargetDictionary!
      const influences = mesh.morphTargetInfluences!

      // Go through all blendshapes of interest and interpolate
      Object.keys(dict).forEach((key) => {
        if (key.startsWith('jaw') || key.startsWith('mouth')) {
          const idx = dict[key]
          const targetValue = targetShapes[key] !== undefined ? targetShapes[key] : 0
          // Smoothly transition morph target weights
          influences[idx] = THREE.MathUtils.lerp(influences[idx], targetValue, 0.3)
        }
      })
    })
  })
}
