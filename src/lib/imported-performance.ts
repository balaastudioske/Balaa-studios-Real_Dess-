import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/** The vetted full-body performance supplied for the stage. */
export const ARTIST_PERFORMANCE_HIP_HOP_PATH = '/library/animations/artist-performance-hip-hop.glb'
export const ARTIST_PERFORMANCE_DRILL_PATH = '/library/animations/reference/artist-performance-drill-upper-body.glb'
export const ARTIST_PERFORMANCE_LOWER_BODY_PATH = '/library/animations/reference/artist-performance-hip-hop-lower-body.glb'

// The imported animation uses a VRM-style J_Bip naming scheme. Dess uses the
// project Mixamo hierarchy, so tracks must be mapped semantically rather than
// by a fragile positional bone index.
const SOURCE_TO_DESS_BONE: Record<string, string> = {
  J_Bip_C_Hips: 'Hips',
  J_Bip_C_Spine: 'Spine',
  J_Bip_C_Chest: 'Spine1',
  J_Bip_C_UpperChest: 'Spine2',
  J_Bip_C_Neck: 'Neck',
  J_Bip_C_Head: 'Head',
  // Plask's exported performer labels are mirrored against Dess' facing
  // direction. Swapping the complete arm chains keeps shoulders, wrists and
  // fingers coherent instead of putting a hand pose on the opposite arm.
  J_Bip_L_Shoulder: 'RightShoulder',
  J_Bip_L_UpperArm: 'RightArm',
  J_Bip_L_LowerArm: 'RightForeArm',
  J_Bip_L_Hand: 'RightHand',
  J_Bip_R_Shoulder: 'LeftShoulder',
  J_Bip_R_UpperArm: 'LeftArm',
  J_Bip_R_LowerArm: 'LeftForeArm',
  J_Bip_R_Hand: 'LeftHand',
  J_Bip_L_UpperLeg: 'LeftUpLeg',
  J_Bip_L_LowerLeg: 'LeftLeg',
  J_Bip_L_Foot: 'LeftFoot',
  J_Bip_L_ToeBase: 'LeftToeBase',
  J_Bip_R_UpperLeg: 'RightUpLeg',
  J_Bip_R_LowerLeg: 'RightLeg',
  J_Bip_R_Foot: 'RightFoot',
  J_Bip_R_ToeBase: 'RightToeBase',
}

for (const side of ['L', 'R'] as const) {
  const targetSide = side === 'L' ? 'Right' : 'Left'
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Thumb1`] = `${targetSide}HandThumb1`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Thumb2`] = `${targetSide}HandThumb2`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Thumb3`] = `${targetSide}HandThumb3`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Index1`] = `${targetSide}HandIndex1`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Index2`] = `${targetSide}HandIndex2`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Index3`] = `${targetSide}HandIndex3`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Middle1`] = `${targetSide}HandMiddle1`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Middle2`] = `${targetSide}HandMiddle2`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Middle3`] = `${targetSide}HandMiddle3`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Ring1`] = `${targetSide}HandRing1`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Ring2`] = `${targetSide}HandRing2`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Ring3`] = `${targetSide}HandRing3`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Little1`] = `${targetSide}HandPinky1`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Little2`] = `${targetSide}HandPinky2`
  SOURCE_TO_DESS_BONE[`J_Bip_${side}_Little3`] = `${targetSide}HandPinky3`
}

function remapImportedTrack(track: THREE.KeyframeTrack, sourceRoot: THREE.Object3D | undefined, targetMesh: THREE.SkinnedMesh): THREE.KeyframeTrack | null {
  const separator = track.name.lastIndexOf('.')
  if (separator === -1) return null
  const sourceBone = track.name.slice(0, separator)
  const property = track.name.slice(separator + 1)
  const targetBone = SOURCE_TO_DESS_BONE[sourceBone]

  // Source translations are calibrated to a different skeleton and can make
  // Dess slide or jump on the stage. Root motion stays under the route system.
  if (!targetBone || property !== 'quaternion') return null

  const sourceRestBone = sourceRoot?.getObjectByName(sourceBone)
  const targetRestBone = targetMesh.skeleton.bones.find((bone) => bone.name === targetBone)
  if (!targetRestBone || track.values.length < 4) return null

  // Plask and Dess have different local bone axes. Convert the authored local
  // rotation into a delta from the Plask rest pose, then apply that delta over
  // Dess' matching rest pose. Copying raw quaternion keys is what produced the
  // broken T-pose / crossed-limb result.
  // Animation-only Plask exports can omit the source scene graph. In that
  // case the first keyed pose is the only reliable local rest reference.
  const sourceRest = sourceRestBone
    ? sourceRestBone.quaternion.clone()
    : new THREE.Quaternion().fromArray(track.values, 0)
  const sourceRestInverse = sourceRest.invert()
  const targetRest = targetRestBone.quaternion.clone()
  const remapped = track.clone()
  remapped.name = `${targetBone}.${property}`
  for (let index = 0; index < remapped.values.length; index += 4) {
    const authored = new THREE.Quaternion().fromArray(remapped.values, index)
    const delta = sourceRestInverse.clone().multiply(authored)
    const dessRotation = targetRest.clone().multiply(delta).normalize()
    dessRotation.toArray(remapped.values, index)
  }
  return remapped
}

/**
 * Loads the vetted source once and produces a rotation-only Dess clip. The
 * target mesh keeps the hook inert until the authoritative Dess rig is ready.
 */
export function useDessArtistPerformanceClip(path: string, targetMesh: THREE.SkinnedMesh | null): THREE.AnimationClip | null {
  const { animations, scene } = useGLTF(path) as unknown as {
    animations: THREE.AnimationClip[]
    scene?: THREE.Group
  }

  return useMemo(() => {
    if (!targetMesh || !animations?.[0]) return null
    const tracks = animations[0].tracks
      .map((track) => remapImportedTrack(track, scene, targetMesh))
      .filter((track): track is THREE.KeyframeTrack => track !== null)
    return tracks.length
      ? new THREE.AnimationClip(path, animations[0].duration, tracks)
      : null
  }, [animations, path, scene, targetMesh])
}

export function useDessArtistPerformance(targetMesh: THREE.SkinnedMesh | null): THREE.AnimationClip | null {
  return useDessArtistPerformanceClip(ARTIST_PERFORMANCE_HIP_HOP_PATH, targetMesh)
}

export const isArtistPerformancePath = (path: string) => path === ARTIST_PERFORMANCE_HIP_HOP_PATH
