'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/useAppStore'
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'

// Canonical Front-Facing Full Hole Stage View Transform (Wider Establishing View)
export const CANONICAL_ARTIST_CAMERA_POS: [number, number, number] = [0, 2.3, 7.8]
export const CANONICAL_ARTIST_TARGET_POS: [number, number, number] = [0, 1.1, 0]
export const CANONICAL_ARTIST_FOV = 46

interface CinematicShotConfig {
  id: string
  name: string
  localPos: [number, number, number]
  localTarget: [number, number, number]
  fov: number
  weight: number
}

const CINEMATIC_SHOTS: CinematicShotConfig[] = [
  { id: 'stage-full-hole', name: 'Full Hole Stage', localPos: [0, 2.3, 7.8], localTarget: [0, 1.1, 0], fov: 46, weight: 4 },
  { id: 'artist-front', name: 'Front Artist', localPos: [0, 1.55, 3.8], localTarget: [0, 1.35, 0], fov: 38, weight: 3 },
  { id: 'medium-performance', name: 'Medium Performance', localPos: [0, 1.6, 4.8], localTarget: [0, 1.30, 0], fov: 42, weight: 3 },
  { id: 'three-quarter-left', name: '3/4 Angle Left', localPos: [-2.8, 1.65, 4.2], localTarget: [0, 1.30, 0], fov: 40, weight: 2 },
  { id: 'three-quarter-right', name: '3/4 Angle Right', localPos: [2.8, 1.65, 4.2], localTarget: [0, 1.30, 0], fov: 40, weight: 2 },
  { id: 'low-angle-hero', name: 'Low Angle Hero', localPos: [0, 0.85, 4.0], localTarget: [0, 1.30, 0], fov: 42, weight: 2 },
  { id: 'elevated-wide', name: 'Elevated Wide', localPos: [0, 3.2, 7.5], localTarget: [0, 1.10, 0], fov: 48, weight: 2 },
  { id: 'stage-wide', name: 'Stage Wide', localPos: [0, 2.4, 8.4], localTarget: [0, 1.15, 0], fov: 48, weight: 3 },
]

export const StageViewportCamera = ({
  controlsRef,
  stageRigRef,
}: {
  controlsRef?: React.RefObject<any>
  stageRigRef?: React.RefObject<THREE.Group | null>
}) => {
  const { camera } = useThree()
  const currentTarget = useRef(new THREE.Vector3(...CANONICAL_ARTIST_TARGET_POS))
  const isTransitioningRef = useRef(false)
  const isFirstMount = useRef(true)

  const { cameraMode, setCameraTransitioning } = useAppStore(
    useShallow((s) => ({
      cameraMode: s.cameraMode,
      setCameraTransitioning: s.setCameraTransitioning,
    }))
  )
  const isPlaying = useAppStore((s) => s.isPlaying)
  const freeRoamTarget = useAppStore((s) => s.freeRoamTarget)
  const cameraResetNonce = useAppStore((s) => s.cameraResetNonce)

  // Intelligent Shot Timing & Selection state
  const activeShotIndexRef = useRef(0)
  const nextShotSwitchTimeRef = useRef(4.8)
  const shotTimerRef = useRef(0)
  const lastShotIdsRef = useRef<string[]>([])

  // Reusable vector objects to avoid per-frame allocations
  const vCamLocal = useMemo(() => new THREE.Vector3(), [])
  const vTargetLocal = useMemo(() => new THREE.Vector3(), [])
  const vCamWorld = useMemo(() => new THREE.Vector3(), [])
  const vTargetWorld = useMemo(() => new THREE.Vector3(), [])

  // 1. Initial Mount: Snap immediately to canonical Artist view
  useEffect(() => {
    camera.position.set(...CANONICAL_ARTIST_CAMERA_POS)
    currentTarget.current.set(...CANONICAL_ARTIST_TARGET_POS)
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      ;(camera as THREE.PerspectiveCamera).fov = CANONICAL_ARTIST_FOV
      ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
    }
    if (controlsRef?.current) {
      controlsRef.current.target.set(...CANONICAL_ARTIST_TARGET_POS)
      controlsRef.current.update()
    }
  }, [camera, controlsRef])

  // 2. Smoothly transition to Canonical Artist View
  const animateToArtistView = (duration = 0.8) => {
    if (!controlsRef?.current) return

    isTransitioningRef.current = true
    setCameraTransitioning(true)

    const stage = stageRigRef?.current
    let targetWorldPos = new THREE.Vector3(...CANONICAL_ARTIST_CAMERA_POS)
    let targetWorldLook = new THREE.Vector3(...CANONICAL_ARTIST_TARGET_POS)
    if (stage) {
      targetWorldPos = stage.localToWorld(targetWorldPos.clone())
      targetWorldLook = stage.localToWorld(targetWorldLook.clone())
    }

    const targetObj = {
      cx: camera.position.x,
      cy: camera.position.y,
      cz: camera.position.z,
      tx: controlsRef.current.target.x,
      ty: controlsRef.current.target.y,
      tz: controlsRef.current.target.z,
      fov: (camera as THREE.PerspectiveCamera).fov || CANONICAL_ARTIST_FOV,
    }

    gsap.killTweensOf(targetObj)
    gsap.to(targetObj, {
      cx: targetWorldPos.x,
      cy: targetWorldPos.y,
      cz: targetWorldPos.z,
      tx: targetWorldLook.x,
      ty: targetWorldLook.y,
      tz: targetWorldLook.z,
      fov: CANONICAL_ARTIST_FOV,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.set(targetObj.cx, targetObj.cy, targetObj.cz)
        currentTarget.current.set(targetObj.tx, targetObj.ty, targetObj.tz)
        if (controlsRef?.current) {
          controlsRef.current.target.set(targetObj.tx, targetObj.ty, targetObj.tz)
          controlsRef.current.update()
        }
        if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
          ;(camera as THREE.PerspectiveCamera).fov = targetObj.fov
          ;(camera as THREE.PerspectiveCamera).updateProjectionMatrix()
        }
      },
      onComplete: () => {
        isTransitioningRef.current = false
        setCameraTransitioning(false)
      },
    })
  }

  // 3. Trigger transition on cameraMode switch or cameraResetNonce
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    if (cameraMode === 'artist') {
      animateToArtistView(0.75)
    }
  }, [cameraMode, cameraResetNonce])

  // 4. Per-Frame Front-Lock Artist Follow-Cam & Centered Performance Tracking
  useFrame((_, delta) => {
    if (cameraMode !== 'artist' || isTransitioningRef.current) return
    if (!controlsRef?.current) return

    const stage = stageRigRef?.current
    const lateralX = freeRoamTarget ? freeRoamTarget[0] : 0
    const lateralZ = freeRoamTarget ? freeRoamTarget[2] : 0

    // CASE A: IDLE / PAUSED ARTIST MODE (Locks to front of stage and tracks Dess walking across deck)
    if (!isPlaying) {
      shotTimerRef.current = 0
      vCamLocal.set(
        CANONICAL_ARTIST_CAMERA_POS[0] + lateralX * 0.35,
        CANONICAL_ARTIST_CAMERA_POS[1],
        CANONICAL_ARTIST_CAMERA_POS[2]
      )
      vTargetLocal.set(
        CANONICAL_ARTIST_TARGET_POS[0] + lateralX * 0.85,
        CANONICAL_ARTIST_TARGET_POS[1],
        CANONICAL_ARTIST_TARGET_POS[2] + lateralZ * 0.35
      )

      if (stage) {
        vCamWorld.copy(stage.localToWorld(vCamLocal.clone()))
        vTargetWorld.copy(stage.localToWorld(vTargetLocal.clone()))
      } else {
        vCamWorld.copy(vCamLocal)
        vTargetWorld.copy(vTargetLocal)
      }

      // Smooth front-lock follow
      camera.position.lerp(vCamWorld, delta * 3.5)
      currentTarget.current.lerp(vTargetWorld, delta * 3.5)

      controlsRef.current.target.copy(currentTarget.current)
      controlsRef.current.update()

      if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const pCam = camera as THREE.PerspectiveCamera
        pCam.fov = THREE.MathUtils.lerp(pCam.fov, CANONICAL_ARTIST_FOV, delta * 2.0)
        pCam.updateProjectionMatrix()
      }
      return
    }

    // CASE B: ACTIVE PERFORMANCE MODE (Auto-Cam cycles shots while keeping Dess strictly centered)
    shotTimerRef.current += delta

    if (shotTimerRef.current >= nextShotSwitchTimeRef.current) {
      shotTimerRef.current = 0
      nextShotSwitchTimeRef.current = 4.5 + Math.random() * 1.0

      const availableShots = CINEMATIC_SHOTS.filter(
        (s) => !lastShotIdsRef.current.slice(-2).includes(s.id)
      )
      const selectedShot = availableShots[Math.floor(Math.random() * availableShots.length)] || CINEMATIC_SHOTS[0]
      activeShotIndexRef.current = CINEMATIC_SHOTS.findIndex((s) => s.id === selectedShot.id)
      lastShotIdsRef.current.push(selectedShot.id)
      if (lastShotIdsRef.current.length > 5) lastShotIdsRef.current.shift()
    }

    const currentShot = CINEMATIC_SHOTS[activeShotIndexRef.current] || CINEMATIC_SHOTS[0]
    
    // Always center the target directly on Dess's live position
    vCamLocal.set(
      currentShot.localPos[0] + lateralX * 0.35,
      currentShot.localPos[1],
      currentShot.localPos[2]
    )
    vTargetLocal.set(
      currentShot.localTarget[0] + lateralX * 0.85,
      currentShot.localTarget[1],
      currentShot.localTarget[2] + lateralZ * 0.35
    )

    if (stage) {
      vCamWorld.copy(stage.localToWorld(vCamLocal.clone()))
      vTargetWorld.copy(stage.localToWorld(vTargetLocal.clone()))
    } else {
      vCamWorld.copy(vCamLocal)
      vTargetWorld.copy(vTargetLocal)
    }

    // Smooth cinematic camera tracking (never jumps/teleports)
    camera.position.lerp(vCamWorld, delta * 2.2)
    currentTarget.current.lerp(vTargetWorld, delta * 2.2)

    controlsRef.current.target.copy(currentTarget.current)
    controlsRef.current.update()

    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pCam = camera as THREE.PerspectiveCamera
      pCam.fov = THREE.MathUtils.lerp(pCam.fov, currentShot.fov, delta * 2.0)
      pCam.updateProjectionMatrix()
    }
  })

  return null
}
