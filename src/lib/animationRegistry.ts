import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { useFBX } from '@react-three/drei'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { ANIMATION_MAPPINGS, type AnimationMapping } from './animations'

/**
 * Strips the Mixamo bone prefix from FBX track names so they match the
 * DESS GLB skeleton which uses plain names (e.g. "Hips" not "mixamorigHips").
 *
 * FBX tracks are named like "mixamorigHips.position" or "mixamorigLeftArm.quaternion".
 * The GLB skeleton uses "Hips", "LeftArm", etc.
 */
const remapTrack = (
  track: THREE.KeyframeTrack,
  sourceRig: THREE.Object3D,
  targetMesh: THREE.SkinnedMesh,
  sourceBindPose?: ReadonlyMap<string, THREE.Quaternion>,
): THREE.KeyframeTrack | null => {
  const separator = track.name.lastIndexOf('.')
  if (separator === -1) return null
  const sourceName = track.name.slice(0, separator)
  const property = track.name.slice(separator + 1)
  const remappedName = sourceName.replace(/^mixamorig(?:[:_])?/i, '')
  // Mixamo commonly carries root translation on Hips. Keeping it makes a
  // switch from dance to performance teleport the artist across the stage.
  // The stage path system owns root movement, so retain pose tracks only.
  if (property !== 'quaternion' || /^(?:Hips|Root)\.position$/i.test(remappedName)) return null

  const sourceBone = sourceRig.getObjectByName(sourceName)
  const targetBone = targetMesh.skeleton.bones.find((bone) => bone.name === remappedName)
  if (!sourceBone || !targetBone) return null

  if (!sourceBindPose) {
    const direct = track.clone()
    direct.name = `${remappedName}.${property}`
    return direct
  }

  // Retarget the authored rotation *relative to the source bind pose*. Plask
  // FBX Hips carries a different base axis than Dess, so copying raw values
  // folds the performer. Applying the source delta over Dess' bind pose keeps
  // all 65 matched joints anatomically aligned with the 73-joint target rig.
  const sourceRest = sourceBindPose.get(sourceName) || sourceBone.quaternion
  const sourceRestInverse = sourceRest.clone().invert()
  const targetRest = targetBone.quaternion.clone()
  const cloned = track.clone()
  cloned.name = `${remappedName}.${property}`
  for (let index = 0; index < cloned.values.length; index += 4) {
    const authored = new THREE.Quaternion().fromArray(cloned.values, index)
    const delta = sourceRestInverse.clone().multiply(authored)
    targetRest.clone().multiply(delta).normalize().toArray(cloned.values, index)
  }
  return cloned
}

export const getMappingById = (animationId: string): AnimationMapping | null => {
  return ANIMATION_MAPPINGS[animationId] || null
}

export const getMappingByFbxPath = (fbxPath: string): AnimationMapping | null => {
  const canonicalPath = fbxPath.replace(/^\/animations\//, '/library/animations/mixamo/')
  for (const [key, mapping] of Object.entries(ANIMATION_MAPPINGS)) {
    const mappingPath = mapping.fbxPath.replace(/^\/animations\//, '/library/animations/mixamo/')
    if (mappingPath === canonicalPath) return mapping
  }
  return null
}

/**
 * Plask/Mixamo FBX exports can contain a one-frame bind-pose stack before the
 * actual take. Prefer the explicit Artist take, otherwise select the longest
 * clip so a reference stub can never become a live performance.
 */
const selectPlayableClip = (animations: THREE.AnimationClip[]) =>
  animations.find((clip) => /^Artist$/i.test(clip.name))
  || animations.reduce<THREE.AnimationClip | null>((longest, clip) => !longest || clip.duration > longest.duration ? clip : longest, null)

/** Plask exports the real performance beside a short Layer0 bind-pose take. */
const readBindPose = (animations: THREE.AnimationClip[]) => {
  const reference = animations.filter((clip) => !/^Artist$/i.test(clip.name)).sort((a, b) => a.duration - b.duration)[0]
  const rotations = new Map<string, THREE.Quaternion>()
  if (!reference) return rotations
  for (const track of reference.tracks) {
    if (!track.name.endsWith('.quaternion') || track.values.length < 4) continue
    rotations.set(track.name.slice(0, -'.quaternion'.length), new THREE.Quaternion().fromArray(track.values, 0))
  }
  return rotations
}

/**
 * Loads an FBX animation and remaps its bone tracks to match the DESS GLB
 * skeleton naming convention.
 *
 * FBX bones:  mixamorigHips, mixamorigSpine, mixamorigLeftArm, …
 * GLB bones:  Hips, Spine, LeftArm, …
 *
 * Instead of using retargetClip (which silently fails when bone names don't
 * match), we clone the source clip and rename every track.
 *
 * @param animationId The ID from ANIMATION_MAPPINGS (e.g., 'happy_idle')
 * @param targetMesh The rigged DESS SkinnedMesh (used only for cache key)
 * @returns Remapped THREE.AnimationClip or null if not found
 */
export const useDessAnimation = (animationId: string, targetMesh: THREE.SkinnedMesh | null): THREE.AnimationClip | null => {
  const mapping = getMappingById(animationId)
  const legacyPath = mapping?.fbxPath || ANIMATION_MAPPINGS['idle_a'].fbxPath
  const fbxPath = legacyPath.startsWith('/animations/') ? legacyPath.replace(/^\/animations\//, '/library/animations/mixamo/') : legacyPath
  
  const fbx = useFBX(fbxPath)

  const clip = useMemo(() => {
    if (!targetMesh || !fbx || !fbx.animations.length) return null

    const sourceClip = selectPlayableClip(fbx.animations)
    if (!sourceClip) return null

    try {
      const sourceBindPose = mapping?.retarget === 'bind-pose' ? readBindPose(fbx.animations) : undefined
      const remappedTracks = sourceClip.tracks
        .map((track) => remapTrack(track, fbx, targetMesh, sourceBindPose))
        .filter((track): track is THREE.KeyframeTrack => track !== null)

      const remapped = new THREE.AnimationClip(
        mapping?.clipName || 'Idle_A',
        sourceClip.duration,
        remappedTracks,
      )
      return remapped
    } catch (e) {
      console.warn(`[AnimationRegistry] Track remapping failed for ${animationId}:`, e)
      return null
    }
  }, [fbx, targetMesh, mapping?.clipName, animationId])

  return clip
}

/**
 * Asynchronously loads and retargets an FBX animation clip without blocking
 * React Suspense rendering of the avatar mesh.
 */
export const useDessAnimationAsync = (animationId: string, targetMesh: THREE.SkinnedMesh | null): THREE.AnimationClip | null => {
  const [clip, setClip] = useState<THREE.AnimationClip | null>(null)
  const mapping = getMappingById(animationId)

  useEffect(() => {
    let cancelled = false
    if (!targetMesh || !mapping) return

    const loader = new FBXLoader()
    const legacyPath = mapping.fbxPath
    const sourcePath = legacyPath.startsWith('/animations/') ? legacyPath.replace(/^\/animations\//, '/library/animations/mixamo/') : legacyPath

    loader.load(
      sourcePath,
      (source) => {
        if (cancelled) return
        const sourceClip = selectPlayableClip(source.animations)
        if (!sourceClip) return
        const sourceBindPose = mapping.retarget === 'bind-pose' ? readBindPose(source.animations) : undefined
        const remappedTracks = sourceClip.tracks
          .map((track) => remapTrack(track, source, targetMesh, sourceBindPose))
          .filter((track): track is THREE.KeyframeTrack => track !== null)

        if (remappedTracks.length && !cancelled) {
          setClip(new THREE.AnimationClip(mapping.clipName || animationId, sourceClip.duration, remappedTracks))
        }
      },
      undefined,
      (error) => {
        console.warn(`[AnimationRegistry] Async load failed for ${animationId}:`, error)
      }
    )

    return () => {
      cancelled = true
    }
  }, [animationId, mapping, targetMesh])

  return clip
}

/**
 * Stream and retarget the full fixed library in the background. Loading every
 * FBX through Suspense would hide the artist until the last file arrives.
 */
export const useDessAnimationLibrary = (
  animationIds: readonly string[],
  targetMesh: THREE.SkinnedMesh | null,
): THREE.AnimationClip[] => {
  const mappings = useMemo(
    () => animationIds
      .map((id) => ({ id, mapping: getMappingById(id) }))
      .filter((entry): entry is { id: string; mapping: AnimationMapping } => Boolean(entry.mapping)),
    [animationIds],
  )
  const [clips, setClips] = useState<THREE.AnimationClip[]>([])

  useEffect(() => {
    let cancelled = false
    setClips([])
    if (!targetMesh) return

    const loader = new FBXLoader()
    const loadNext = async () => {
      for (const { id, mapping } of mappings) {
        if (cancelled) return
        try {
          const sourcePath = mapping.fbxPath.startsWith('/animations/') ? mapping.fbxPath.replace(/^\/animations\//, '/library/animations/mixamo/') : mapping.fbxPath
          const source = await loader.loadAsync(sourcePath)
          const sourceClip = selectPlayableClip(source.animations)
          if (!sourceClip || cancelled) continue
          const tracks = sourceClip.tracks
            .map((track) => remapTrack(track, source, targetMesh, mapping.retarget === 'bind-pose' ? readBindPose(source.animations) : undefined))
            .filter((track): track is THREE.KeyframeTrack => track !== null)
          if (tracks.length && !cancelled) {
            const clip = new THREE.AnimationClip(`mixamo:${id}`, sourceClip.duration, tracks)
            setClips((current) => [...current, clip])
          }
        } catch (error) {
          console.warn(`[AnimationRegistry] Unable to stream ${id}:`, error)
        }
      }
    }
    void loadNext()
    return () => { cancelled = true }
  }, [mappings, targetMesh])

  return clips
}
