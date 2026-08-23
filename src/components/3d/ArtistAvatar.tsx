'use client'

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, useTexture } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'
import { FingerRigSystem, HandPosePreset } from '@/lib/fingerRig'
import { useDessAnimation, useDessAnimationAsync, useDessAnimationLibrary } from '@/lib/animationRegistry'
import { ARTIST_PERFORMANCE_DRILL_PATH, ARTIST_PERFORMANCE_LOWER_BODY_PATH, useDessArtistPerformance, useDessArtistPerformanceClip } from '@/lib/imported-performance'
import { getAnimationIdForSequenceStep, STAGE_ROUTINE_ANIMATION_IDS } from '@/lib/animations'
import { useAvatarLipSync } from '@/hooks/useAvatarLipSync'
import { usePerformanceSync } from '@/hooks/usePerformanceSync'
import { useAppStore } from '@/store/useAppStore'
import { getChoreographyDuration, getRouteState, getTempoMatchedSpeed, PERFORMANCE_CLIP_BPM } from '@/lib/performance-choreography'

export interface ArtistAvatarProps {
  modelUrl?: string
  conceptMode?: boolean
  position?: [number, number, number]
  handPose?: HandPosePreset
}

export interface ArtistAvatarRef {
  group: THREE.Group | null
  fingerRig: FingerRigSystem
  setPose: (pose: HandPosePreset) => void
}

// Stage constraints from audit
const STAGE_BOUNDS = {
  minX: -7.55,
  maxX: 7.55,
  minZ: -2.80,
  maxZ: 2.80,
  groundY: 0.0,
}

// The supplied Plask motions remain distinct from the complete published
// Mixamo folder. All non-idle motions can be selected by the stage routine.
// Only validated Plask Artist takes drive the main performance. The older
// imported clips remain available for admin review but cannot be picked by
// the live routine and reintroduce distorted limbs or bind-pose flashes.
const PRIMARY_PERFORMANCE_ROUTINES = ['plask-performance'] as const
// Foot bones sit around the ankle rather than at the sole. Keep a conservative
// clearance so footwear never intersects the stage deck during a gait cycle.
const FOOT_SOLE_OFFSET = 0.13

export const ArtistAvatar = forwardRef<ArtistAvatarRef, ArtistAvatarProps>(
  ({ modelUrl = '/assets/models/dess.glb?v=73-bone-master', conceptMode = false, position = [0, 0, 0], handPose = 'relaxed' }, ref) => {
    const rootGroupRef = useRef<THREE.Group>(null!)
    const isPlaying = useAppStore((s) => s.isPlaying)
    const currentTrack = useAppStore((s) => s.currentTrack)
    const audioPulse = useAppStore((s) => s.audioPulse)
    const appMode = useAppStore((s) => s.appMode)
    const sequenceStep = useAppStore((s) => s.sequenceStep)
    const activeChoreography = useAppStore((s) => s.activeChoreography)
    const performanceStartedAt = useAppStore((s) => s.performanceStartedAt)
    const freeRoamTarget = useAppStore((s) => s.freeRoamTarget)
    const setFreeRoamTarget = useAppStore((s) => s.setFreeRoamTarget)
    const routineClipNameRef = useRef<string>('idle')
    const activeAction = useRef<THREE.AnimationAction | null>(null)
    const routeAnchor = useRef<{ startedAt: number | null; offset: THREE.Vector3 }>({ startedAt: null, offset: new THREE.Vector3() })
    const headLookOffset = useRef(new THREE.Quaternion())
    const handheldMicRef = useRef<THREE.Group | null>(null)
    const routineForSegment = useRef(new Map<number, string>())
    const [routineClipName, setRoutineClipName] = useState('idle')

    // Finger Physics System (Section 5 & 10)
    const fingerRig = useMemo(() => new FingerRigSystem(), [])

    // Load custom hoodie texture with black body, white sleeves, and official BALAA chest emblem
    const customHoodieTexture = useTexture('/library/garments/dess_hoodie_custom.png')
    useEffect(() => {
      if (customHoodieTexture) {
        customHoodieTexture.colorSpace = THREE.SRGBColorSpace
        customHoodieTexture.flipY = false
        customHoodieTexture.needsUpdate = true
      }
    }, [customHoodieTexture])

    // Load the one authoritative DESS artist; all Mixamo clips are retargeted to this skeleton.
    const { scene: sourceScene } = useGLTF(modelUrl)

    // Clone avatar scene instance
    const avatarInstance = useMemo(() => {
      const cloned = clone(sourceScene)
      cloned.traverse((node: any) => {
        if (node.isMesh || node.isSkinnedMesh) {
          node.castShadow = true
          node.receiveShadow = true
          
          // 1. Remove artist's hat / cap completely
          const isHatNode = /hat|cap/i.test(node.name)
          const isHatMat = node.material && (/hat|cap/i.test(node.material.name) || (Array.isArray(node.material) && node.material.some((m: any) => /hat|cap/i.test(m.name))))
          if (isHatNode || isHatMat) {
            node.visible = false
            if (node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach((m: any) => { m.visible = false })
              } else {
                node.material.visible = false
              }
            }
            return
          }

          if (node.material) {
            node.material = Array.isArray(node.material)
              ? node.material.map((m: THREE.Material) => m.clone())
              : node.material.clone()
            
            // 2. Custom hoodie: Deep matte black body, crisp white sleeves, BALAA chest emblem
            if (node.name === 'outfit_top' || (node.material && node.material.name === 'outfit_top')) {
              if (node.material.isMeshStandardMaterial && customHoodieTexture) {
                node.material.color.set('#ffffff')
                node.material.map = customHoodieTexture
                node.material.roughness = 0.88
                node.material.metalness = 0.02
                node.material.needsUpdate = true
              }
            }

            // 3. Pants / Bottoms: Solid Jet Black (not washed-out grey)
            if (node.name === 'outfit_bottom' || (node.material && node.material.name === 'outfit_bottom')) {
              if (node.material.isMeshStandardMaterial) {
                node.material.color.set('#050508')
                node.material.roughness = 0.90
                node.material.metalness = 0.02
                node.material.needsUpdate = true
              }
            }

            // 4. White sandals / shoes: Pure Crisp White
            if (node.name === 'outfit_shoes' || (node.material && node.material.name === 'outfit_shoes')) {
              if (node.material.isMeshStandardMaterial) {
                node.material.color.set('#ffffff')
                node.material.roughness = 0.35
                node.material.metalness = 0.05
                node.material.needsUpdate = true
              }
            }

            if (node.material.isMeshStandardMaterial && node.name !== 'outfit_top' && node.name !== 'outfit_bottom' && node.name !== 'outfit_shoes') {
              // Preserve facial texture detail under concert lights
              node.material.roughness = 0.84
              node.material.metalness = 0
              node.material.envMapIntensity = 0.35
              if (node.material.normalScale) node.material.normalScale.setScalar(0.48)
            }
          }
        }
      })
      return cloned
    }, [sourceScene, customHoodieTexture])

    // Find target skinned mesh for skeleton reference
    const targetSkinnedMesh = useMemo(() => {
      let target: THREE.SkinnedMesh | null = null
      avatarInstance.traverse((child: any) => {
        if (child.isSkinnedMesh && child.skeleton && !target) {
          target = child as THREE.SkinnedMesh
        }
      })
      return target
    }, [avatarInstance])
    const headBone = useMemo(() => avatarInstance.getObjectByName('Head') || avatarInstance.getObjectByName('mixamorigHead'), [avatarInstance])

    // Load initial essential idle animation asynchronously so avatar renders instantly without blocking Suspense
    const idleClip = useDessAnimationAsync('idle_a', targetSkinnedMesh)
    const artistPerformanceClip = useDessArtistPerformance(targetSkinnedMesh)
    const plaskPerformanceClip = useDessAnimationAsync('plask_performance_1', targetSkinnedMesh)
    const drillPerformanceClip = useDessArtistPerformanceClip(ARTIST_PERFORMANCE_DRILL_PATH, targetSkinnedMesh)
    const lowerBodyPerformanceClip = useDessArtistPerformanceClip(ARTIST_PERFORMANCE_LOWER_BODY_PATH, targetSkinnedMesh)
    const mixamoRoutineClips = useDessAnimationLibrary(STAGE_ROUTINE_ANIMATION_IDS, targetSkinnedMesh)
    const danceBreakClip = useDessAnimationAsync('robot_dance', targetSkinnedMesh)
    const walkClip = useDessAnimationAsync('walk_forward', targetSkinnedMesh)
    const sequenceAnimationId = getAnimationIdForSequenceStep(sequenceStep || '') || 'idle_a'
    const hasSelectedMotion = Boolean(sequenceStep && sequenceAnimationId !== 'idle_a')
    const sequenceClip = useDessAnimationAsync(sequenceAnimationId, targetSkinnedMesh)

    // Package animation clips
    const clips = useMemo(() => {
      const arr: THREE.AnimationClip[] = []
      if (idleClip) {
        const c = idleClip.clone()
        c.name = 'idle'
        arr.push(c)
      }
      if (artistPerformanceClip) {
        const c = artistPerformanceClip.clone()
        c.name = 'hip-hop-performance'
        arr.push(c)
      }
      if (plaskPerformanceClip) {
        const c = plaskPerformanceClip.clone()
        c.name = 'plask-performance'
        arr.push(c)
      }
      if (drillPerformanceClip) {
        const c = drillPerformanceClip.clone()
        c.name = 'drill-performance'
        arr.push(c)
      }
      if (lowerBodyPerformanceClip) {
        const c = lowerBodyPerformanceClip.clone()
        c.name = 'hip-hop-lower-body'
        arr.push(c)
      }
      if (drillPerformanceClip && lowerBodyPerformanceClip) {
        const lowerBodyTracks = lowerBodyPerformanceClip.tracks.filter((track) => /(?:Hips|UpLeg|Leg|Foot|ToeBase)\.quaternion$/.test(track.name))
        const upperBodyTracks = drillPerformanceClip.tracks.filter((track) => !/(?:Hips|UpLeg|Leg|Foot|ToeBase)\.quaternion$/.test(track.name))
        const c = new THREE.AnimationClip('primary-performance-combo', Math.max(drillPerformanceClip.duration, lowerBodyPerformanceClip.duration), [...upperBodyTracks, ...lowerBodyTracks])
        arr.push(c)
      }
      arr.push(...mixamoRoutineClips.map((clip) => clip.clone()))
      if (danceBreakClip) {
        const c = danceBreakClip.clone()
        c.name = 'dance-break'
        arr.push(c)
      }
      if (walkClip) {
        const c = walkClip.clone()
        c.name = 'walk'
        arr.push(c)
      }
      if (sequenceClip) {
        const c = sequenceClip.clone()
        c.name = 'sequence'
        arr.push(c)
      }
      return arr
    }, [idleClip, artistPerformanceClip, plaskPerformanceClip, drillPerformanceClip, lowerBodyPerformanceClip, mixamoRoutineClips, danceBreakClip, walkClip, sequenceClip])

    const { mixer } = useAnimations(clips, avatarInstance)
    usePerformanceSync(mixer)

    // Initialize Finger Rig System on the primary DESS artist instance
    useEffect(() => {
      if (avatarInstance) {
        fingerRig.init(avatarInstance)
        fingerRig.setHandPose('Right', 'mic-grip')
        fingerRig.setHandPose('Left', handPose)
      }
    }, [avatarInstance, fingerRig, handPose])

    // Sync Hand Pose changes: Right hand stays on microphone; Left hand uses selected pose
    useEffect(() => {
      fingerRig.setHandPose('Right', 'mic-grip')
      fingerRig.setHandPose('Left', handPose)
    }, [fingerRig, handPose])

    // The microphone is parented directly to the animated right-hand bone hierarchy.
    // Aligned to sit squarely in the palm tunnel with the grille extending out between index & thumb.
    useEffect(() => {
      const hand = avatarInstance.getObjectByName('RightHand') || avatarInstance.getObjectByName('mixamorigRightHand')
      if (!hand) return
      const micSocket = new THREE.Group()
      micSocket.name = 'RightHand_MicrophoneSocket'

      // Exact anatomical palm center: X=0 (mid-palm), Y=0.048 (knuckle level), Z=0.022 (inside grip)
      // Rotated so cylinder axis extends from pinky (-X) through index/thumb (+X) towards mouth (+Z)
      micSocket.position.set(0.0, 0.048, 0.022)
      micSocket.rotation.set(0.25, 0.18, -Math.PI / 2 + 0.15)

      const mic = new THREE.Group()
      mic.name = 'HandheldPerformanceMicrophone'

      // 1. Tapered dark matte metallic body handle (centered in grip)
      const handleGeom = new THREE.CylinderGeometry(0.013, 0.017, 0.18, 16)
      const handleMat = new THREE.MeshStandardMaterial({
        color: '#121316',
        metalness: 0.85,
        roughness: 0.24,
      })
      const handle = new THREE.Mesh(handleGeom, handleMat)
      handle.position.y = 0.0

      // 2. Middle grip sleeve / anti-slip band
      const gripGeom = new THREE.CylinderGeometry(0.0165, 0.0165, 0.065, 16)
      const gripMat = new THREE.MeshStandardMaterial({
        color: '#1e2026',
        metalness: 0.45,
        roughness: 0.75,
      })
      const grip = new THREE.Mesh(gripGeom, gripMat)
      grip.position.y = 0.0

      // 3. Brand / Power LED accent ring
      const ringGeom = new THREE.CylinderGeometry(0.0178, 0.0178, 0.007, 16)
      const ringMat = new THREE.MeshStandardMaterial({
        color: '#f97316',
        emissive: '#f97316',
        emissiveIntensity: 1.2,
        roughness: 0.2,
      })
      const ring = new THREE.Mesh(ringGeom, ringMat)
      ring.position.y = 0.055

      // 4. Chrome capsule collar
      const collarGeom = new THREE.CylinderGeometry(0.020, 0.0165, 0.020, 16)
      const collarMat = new THREE.MeshStandardMaterial({
        color: '#94a3b8',
        metalness: 0.9,
        roughness: 0.18,
      })
      const collar = new THREE.Mesh(collarGeom, collarMat)
      collar.position.y = 0.075

      // 5. Classic concert dynamic mic wire mesh dome grille
      const grilleGeom = new THREE.SphereGeometry(0.032, 18, 14)
      const grilleMat = new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.88,
        roughness: 0.22,
      })
      const grille = new THREE.Mesh(grilleGeom, grilleMat)
      grille.position.y = 0.11

      mic.add(handle, grip, ring, collar, grille)
      mic.visible = true // Always visible in the artist's hand

      micSocket.add(mic)
      hand.add(micSocket)
      handheldMicRef.current = micSocket

      return () => {
        hand.remove(micSocket)
        handleGeom.dispose(); handleMat.dispose()
        gripGeom.dispose(); gripMat.dispose()
        ringGeom.dispose(); ringMat.dispose()
        collarGeom.dispose(); collarMat.dispose()
        grilleGeom.dispose(); grilleMat.dispose()
        handheldMicRef.current = null
      }
    }, [avatarInstance])

    // Integrate Lip Sync System
    useAvatarLipSync(
      mixer ?? undefined,
      avatarInstance as unknown as THREE.Group,
      currentTrack?.id || null,
      isPlaying
    )

    // Ensure DESS starts centrally framed on the stage floor [0, 0, 0] on mount
    useEffect(() => {
      if (rootGroupRef.current) {
        rootGroupRef.current.position.set(0, 0, 0)
        rootGroupRef.current.rotation.set(0, 0, 0)
      }
    }, [])

    // Each route mark holds a randomly chosen singing/dance clip. Dess uses a
    // walk clip only during a mark's explicit walk-in window.
    useEffect(() => {
      if (hasSelectedMotion || (appMode as string) === 'sequence') {
        routineClipNameRef.current = 'sequence'
        setRoutineClipName('sequence')
        return
      }
      if (!isPlaying || appMode !== 'performing' || !performanceStartedAt) {
        routineForSegment.current.clear()
        if (!freeRoamTarget) {
          routineClipNameRef.current = 'idle'
          setRoutineClipName('idle')
        }
        return
      }

      const startedAt = performanceStartedAt || Date.now()
      const updateRoutine = () => {
        const available = [
          ...PRIMARY_PERFORMANCE_ROUTINES.filter((name) => clips.some((clip) => clip.name === name)),
        ]
        if (!available.length) return
        const elapsed = (Date.now() - startedAt) / 1000
        const routeSeconds = activeChoreography
          ? (elapsed * getTempoMatchedSpeed(currentTrack?.bpm, PERFORMANCE_CLIP_BPM.stageRoute)) % getChoreographyDuration(activeChoreography)
          : elapsed
        const route = activeChoreography ? getRouteState(activeChoreography.movement, routeSeconds) : null
        if (route?.moving) {
          routineClipNameRef.current = 'walk'
          setRoutineClipName('walk')
          return
        }
        const segment = route ? activeChoreography!.movement.findIndex((cue) => cue.id === route.cue.id) : Math.floor(elapsed / 20)
        // Break the walk → vocal loop with a short dance at every newly
        // reached stage mark. It uses the existing Mixamo dance clips and
        // crossfades back to the primary Plask performance naturally.
        const danceCuts = ['hip_hop_dancing', 'hip_hop_dancing_1', 'robot_dance', 'bboy_move']
        const atMark = route ? routeSeconds - route.cue.at : 99
        const danceId = danceCuts[Math.max(0, segment) % danceCuts.length]
        if (segment > 0 && atMark >= 0 && atMark < 2.4 && clips.some((clip) => clip.name === `mixamo:${danceId}`)) {
          routineClipNameRef.current = `mixamo:${danceId}`
          setRoutineClipName(`mixamo:${danceId}`)
          return
        }
        const requested = route?.cue.animationId
        if (requested && requested !== 'random-performance' && clips.some((clip) => clip.name === `mixamo:${requested}`)) {
          routineClipNameRef.current = `mixamo:${requested}`
          setRoutineClipName(`mixamo:${requested}`)
          return
        }
        let routine = routineForSegment.current.get(segment)
        if (!routine) {
          const previous = routineForSegment.current.get(segment - 1)
          const pool = available.filter((name) => name !== previous)
          routine = (pool.length ? pool : available)[Math.floor(Math.random() * (pool.length || available.length))]
          routineForSegment.current.set(segment, routine)
        }
        routineClipNameRef.current = routine
        setRoutineClipName(routine)
      }
      updateRoutine()
      const timer = window.setInterval(updateRoutine, 500)
      return () => window.clearInterval(timer)
    }, [activeChoreography, appMode, clips, currentTrack?.bpm, freeRoamTarget, hasSelectedMotion, isPlaying, performanceStartedAt, sequenceAnimationId])

    // Animation playback state management with smooth seamless crossfading
    useEffect(() => {
      if (!mixer || clips.length === 0) return

      const clip = clips.find((c) => c.name === routineClipName) || clips.find((c) => c.name === 'idle')
      if (!clip) return

      const action = mixer.clipAction(clip)
      const authoredBpm = routineClipName === 'drill-performance'
        ? PERFORMANCE_CLIP_BPM.drill
        : routineClipName === 'walk'
          ? PERFORMANCE_CLIP_BPM.stageRoute
        : routineClipName === 'hip-hop-performance'
          ? PERFORMANCE_CLIP_BPM.hipHop
        : routineClipName === 'dance-break'
          ? PERFORMANCE_CLIP_BPM.danceBreak
          : PERFORMANCE_CLIP_BPM.hipHop

      // override = song BPM / source-animation BPM for beat synchronization
      const route = activeChoreography && performanceStartedAt
        ? getRouteState(activeChoreography.movement, ((Date.now() - performanceStartedAt) / 1000 * getTempoMatchedSpeed(currentTrack?.bpm, PERFORMANCE_CLIP_BPM.stageRoute)) % getChoreographyDuration(activeChoreography))
        : null
      const walkDistance = route ? Math.hypot(route.to[0] - route.from[0], route.to[2] - route.from[2]) : 0
      const walkCadence = routineClipName === 'walk' && route?.moving
        ? THREE.MathUtils.clamp((walkDistance / Math.max(route.travelDuration, 0.1)) / 1.15, 0.78, 1.22)
        : 1

      action.timeScale = getTempoMatchedSpeed(currentTrack?.bpm, authoredBpm) * walkCadence

      if (activeAction.current === action) return
      const previous = activeAction.current

      action.enabled = true
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.play()

      if (previous && previous !== action) {
        action.crossFadeFrom(previous, routineClipName === 'walk' ? 0.2 : 0.45, true)
      } else {
        action.fadeIn(0.3)
      }

      activeAction.current = action
    }, [mixer, clips, currentTrack?.bpm, routineClipName])

    // Per-frame physics, smooth full-rate animation, stage clamping, and finger rig updates
    useFrame(({ clock, pointer }, delta) => {
      // 1. Advance animation mixer smoothly on original authored frames (native 60fps)
      // Remove previous additive presentation head offset before clip evaluation
      if (headBone) headBone.quaternion.multiply(headLookOffset.current.clone().invert())
      
      if (mixer) {
        mixer.update(delta)
      }

      // 2. Apply 2nd-order Finger Spring Physics over current pose
      if (fingerRig && fingerRig.isInitialized) {
        fingerRig.applyFrame(clock.elapsedTime, audioPulse, delta, avatarInstance)
      }

      // Presentation-style look-at: smooth, damped mouse follow for head
      if (headBone) {
        const yaw = THREE.MathUtils.clamp(pointer.x * 0.28, -0.28, 0.28)
        const pitch = THREE.MathUtils.clamp(-pointer.y * 0.14, -0.14, 0.14)
        const nextOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'))
        headBone.quaternion.multiply(nextOffset)
        headLookOffset.current.copy(nextOffset)
      }

      // 3. Timed per-song movement. The artist never leaves the physical stage envelope.
      // DESS is parented directly inside the stage shuttle rig, so all movement is local.
      if (rootGroupRef.current && isPlaying && activeChoreography && performanceStartedAt) {
        const routeSpeed = getTempoMatchedSpeed(currentTrack?.bpm, PERFORMANCE_CLIP_BPM.stageRoute)
        const elapsed = (Math.max(0, (Date.now() - performanceStartedAt) / 1000) * routeSpeed) % getChoreographyDuration(activeChoreography)
        const route = getRouteState(activeChoreography.movement, elapsed)
        if (route) {
          const p = rootGroupRef.current.position
          p.x = THREE.MathUtils.clamp(
            THREE.MathUtils.lerp(route.from[0], route.to[0], route.progress),
            STAGE_BOUNDS.minX,
            STAGE_BOUNDS.maxX
          )
          p.z = THREE.MathUtils.clamp(
            THREE.MathUtils.lerp(route.from[2], route.to[2], route.progress),
            STAGE_BOUNDS.minZ,
            STAGE_BOUNDS.maxZ
          )
          p.y = 0.0
          if (route.moving) {
            const heading = Math.atan2(route.to[0] - route.from[0], route.to[2] - route.from[2])
            rootGroupRef.current.rotation.y = THREE.MathUtils.damp(rootGroupRef.current.rotation.y, heading, 8, delta)
          } else {
            rootGroupRef.current.rotation.y = THREE.MathUtils.damp(rootGroupRef.current.rotation.y, 0, 7, delta)
          }
        }
      }

      // A paused artist walks smoothly to any clicked point on the stage deck
      if (rootGroupRef.current && !isPlaying && freeRoamTarget) {
        const p = rootGroupRef.current.position
        const deltaX = freeRoamTarget[0] - p.x
        const deltaZ = freeRoamTarget[2] - p.z
        const distance = Math.hypot(deltaX, deltaZ)

        if (distance < 0.08) {
          p.x = THREE.MathUtils.clamp(freeRoamTarget[0], STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX)
          p.z = THREE.MathUtils.clamp(freeRoamTarget[2], STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ)
          p.y = 0.0
          setFreeRoamTarget(null)
          if (routineClipNameRef.current !== 'idle') {
            routineClipNameRef.current = 'idle'
            setRoutineClipName('idle')
          }
        } else {
          const step = Math.min(distance, delta * 1.35)
          p.x = THREE.MathUtils.clamp(p.x + (deltaX / distance) * step, STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX)
          p.z = THREE.MathUtils.clamp(p.z + (deltaZ / distance) * step, STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ)
          p.y = 0.0
          const heading = Math.atan2(deltaX, deltaZ)
          rootGroupRef.current.rotation.y = THREE.MathUtils.damp(rootGroupRef.current.rotation.y, heading, 10, delta)
          if (routineClipNameRef.current !== 'walk') {
            routineClipNameRef.current = 'walk'
            setRoutineClipName('walk')
          }
        }
      } else if (rootGroupRef.current && !isPlaying) {
        rootGroupRef.current.rotation.y = THREE.MathUtils.damp(rootGroupRef.current.rotation.y, 0, 7, delta)
      }

      // 4. Strict Stage Anchoring: DESS and stage are ONE in local space.
      // DESS is permanently anchored to the stage floor (p.y = 0.0) within deck bounds.
      if (rootGroupRef.current) {
        const p = rootGroupRef.current.position
        p.x = THREE.MathUtils.clamp(p.x, STAGE_BOUNDS.minX, STAGE_BOUNDS.maxX)
        p.z = THREE.MathUtils.clamp(p.z, STAGE_BOUNDS.minZ, STAGE_BOUNDS.maxZ)
        p.y = 0.0
      }
      if (handheldMicRef.current) handheldMicRef.current.visible = isPlaying
    })

    // Expose ref
    useImperativeHandle(ref, () => ({
      group: rootGroupRef.current,
      fingerRig,
      setPose: (pose: HandPosePreset) => fingerRig.setPose(pose),
    }))

    return (
      <group ref={rootGroupRef} position={position}>
        <primitive object={avatarInstance} />
      </group>
    )
  }
)

ArtistAvatar.displayName = 'ArtistAvatar'

useGLTF.preload('/assets/models/dess.glb?v=73-bone-master')

