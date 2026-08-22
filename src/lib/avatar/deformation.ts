/**
 * Avatar Deformation Engine
 * 
 * Provides non-destructive vertex-level deformation controlled by
 * high-level body proportion sliders. Works on the existing DESS GLB
 * skeleton/mesh without re-topology.
 *
 * Each deformation region is defined by a bone anchor + radius + axis.
 * Slider values map to scale/translate operations with smooth falloff.
 */
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeformationSlider {
  id: string
  label: string
  group: string
  min: number
  max: number
  default: number
  /** Bone used as the anchor centre for falloff */
  anchorBone: string
  /** Radius of influence (model-space units) */
  radius: number
  /** Which axes are affected: 'x' | 'y' | 'z' | 'xy' | 'xz' | 'xyz' */
  axes: string
  /** Scale (multiplicative) or translate (additive) */
  mode: 'scale' | 'translate'
}

export interface DeformationProfile {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  values: Record<string, number>
}

// ---------------------------------------------------------------------------
// Slider definitions — map to avatar body regions
// ---------------------------------------------------------------------------

export const DEFORMATION_SLIDERS: DeformationSlider[] = [
  // Body
  { id: 'height',        label: 'Height',           group: 'Body',  min: 0.85, max: 1.15, default: 1, anchorBone: 'Hips',          radius: 999,  axes: 'y',   mode: 'scale' },
  { id: 'shoulderWidth', label: 'Shoulder Width',   group: 'Body',  min: 0.8,  max: 1.3,  default: 1, anchorBone: 'Spine2',        radius: 0.25, axes: 'x',   mode: 'scale' },
  { id: 'chestDepth',    label: 'Chest Depth',      group: 'Body',  min: 0.85, max: 1.25, default: 1, anchorBone: 'Spine2',        radius: 0.2,  axes: 'z',   mode: 'scale' },
  { id: 'waist',         label: 'Waist',            group: 'Body',  min: 0.8,  max: 1.3,  default: 1, anchorBone: 'Spine',         radius: 0.18, axes: 'xz',  mode: 'scale' },
  { id: 'hipWidth',      label: 'Hip Width',        group: 'Body',  min: 0.85, max: 1.25, default: 1, anchorBone: 'Hips',          radius: 0.2,  axes: 'x',   mode: 'scale' },
  { id: 'armThick',      label: 'Arm Thickness',    group: 'Body',  min: 0.7,  max: 1.4,  default: 1, anchorBone: 'LeftArm',       radius: 0.2,  axes: 'xz',  mode: 'scale' },
  { id: 'forearmThick',  label: 'Forearm Thickness',group: 'Body',  min: 0.7,  max: 1.4,  default: 1, anchorBone: 'LeftForeArm',   radius: 0.18, axes: 'xz',  mode: 'scale' },
  { id: 'thighThick',    label: 'Thigh Thickness',  group: 'Body',  min: 0.7,  max: 1.4,  default: 1, anchorBone: 'LeftUpLeg',     radius: 0.22, axes: 'xz',  mode: 'scale' },
  { id: 'calfThick',     label: 'Calf Thickness',   group: 'Body',  min: 0.7,  max: 1.4,  default: 1, anchorBone: 'LeftLeg',       radius: 0.18, axes: 'xz',  mode: 'scale' },
  { id: 'handScale',     label: 'Hand Scale',       group: 'Body',  min: 0.7,  max: 1.3,  default: 1, anchorBone: 'LeftHand',      radius: 0.12, axes: 'xyz', mode: 'scale' },
  { id: 'footScale',     label: 'Foot Scale',       group: 'Body',  min: 0.7,  max: 1.3,  default: 1, anchorBone: 'LeftFoot',      radius: 0.12, axes: 'xyz', mode: 'scale' },

  // Head
  { id: 'headWidth',     label: 'Head Width',       group: 'Head',  min: 0.85, max: 1.15, default: 1, anchorBone: 'Head',          radius: 0.15, axes: 'x',   mode: 'scale' },
  { id: 'headHeight',    label: 'Head Height',      group: 'Head',  min: 0.9,  max: 1.15, default: 1, anchorBone: 'Head',          radius: 0.15, axes: 'y',   mode: 'scale' },
  { id: 'jawWidth',      label: 'Jaw Width',        group: 'Head',  min: 0.85, max: 1.2,  default: 1, anchorBone: 'Head',          radius: 0.08, axes: 'x',   mode: 'scale' },
  { id: 'neckThick',     label: 'Neck Thickness',   group: 'Head',  min: 0.8,  max: 1.3,  default: 1, anchorBone: 'Neck',          radius: 0.1,  axes: 'xz',  mode: 'scale' },
]

// ---------------------------------------------------------------------------
// Default profile
// ---------------------------------------------------------------------------

export function createDefaultProfile(): DeformationProfile {
  const values: Record<string, number> = {}
  for (const s of DEFORMATION_SLIDERS) values[s.id] = s.default
  return {
    id: 'default',
    name: 'Default Proportions',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    values,
  }
}

// ---------------------------------------------------------------------------
// Runtime deformation helpers
// ---------------------------------------------------------------------------

const _boneWorldPos = new THREE.Vector3()
const _vertexPos = new THREE.Vector3()

/**
 * Applies a smooth (quadratic) falloff based on distance from the anchor.
 */
function falloff(distance: number, radius: number): number {
  if (radius >= 999) return 1 // global effect (e.g. height)
  const t = Math.min(distance / radius, 1)
  return 1 - t * t // quadratic ease-out
}

/**
 * Apply deformation profile to a SkinnedMesh.
 * Modifies the geometry position attribute in-place.
 * Call this whenever slider values change.
 *
 * @param mesh    The target SkinnedMesh
 * @param profile The deformation profile with slider values
 * @param originalPositions A Float32Array snapshot of the un-deformed positions
 */
export function applyDeformation(
  mesh: THREE.SkinnedMesh,
  profile: DeformationProfile,
  originalPositions: Float32Array,
  skeleton: THREE.Skeleton,
) {
  const geo = mesh.geometry
  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
  const positions = posAttr.array as Float32Array

  // Reset to originals
  positions.set(originalPositions)

  for (const slider of DEFORMATION_SLIDERS) {
    const value = profile.values[slider.id] ?? slider.default
    if (Math.abs(value - 1) < 0.001 && slider.mode === 'scale') continue
    if (Math.abs(value) < 0.001 && slider.mode === 'translate') continue

    // Find the anchor bone world position
    const bone = skeleton.getBoneByName(slider.anchorBone)
    if (!bone) continue
    bone.getWorldPosition(_boneWorldPos)

    // Mirror: apply to both sides for symmetric sliders
    const mirrorBoneName = slider.anchorBone.replace('Left', 'Right')
    const mirrorBone = mirrorBoneName !== slider.anchorBone
      ? skeleton.getBoneByName(mirrorBoneName)
      : null

    const anchors = [_boneWorldPos.clone()]
    if (mirrorBone) {
      const mirrorPos = new THREE.Vector3()
      mirrorBone.getWorldPosition(mirrorPos)
      anchors.push(mirrorPos)
    }

    for (let i = 0; i < positions.length; i += 3) {
      _vertexPos.set(positions[i], positions[i + 1], positions[i + 2])

      // Use closest anchor for influence
      let bestInfluence = 0
      for (const anchor of anchors) {
        const dist = _vertexPos.distanceTo(anchor)
        bestInfluence = Math.max(bestInfluence, falloff(dist, slider.radius))
      }

      if (bestInfluence < 0.001) continue

      const axes = slider.axes
      if (slider.mode === 'scale') {
        const s = 1 + (value - 1) * bestInfluence
        if (axes.includes('x')) positions[i]     = anchors[0].x + (positions[i]     - anchors[0].x) * s
        if (axes.includes('y')) positions[i + 1] = anchors[0].y + (positions[i + 1] - anchors[0].y) * s
        if (axes.includes('z')) positions[i + 2] = anchors[0].z + (positions[i + 2] - anchors[0].z) * s
      } else {
        if (axes.includes('x')) positions[i]     += value * bestInfluence
        if (axes.includes('y')) positions[i + 1] += value * bestInfluence
        if (axes.includes('z')) positions[i + 2] += value * bestInfluence
      }
    }
  }

  posAttr.needsUpdate = true
  geo.computeVertexNormals()
  geo.computeBoundingSphere()
}

/**
 * Snapshot the un-deformed vertex positions of a mesh.
 */
export function snapshotPositions(mesh: THREE.SkinnedMesh): Float32Array {
  const posAttr = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
  return new Float32Array(posAttr.array as Float32Array)
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'balaa_avatar_deformation'

export function saveProfile(profile: DeformationProfile): void {
  profile.updatedAt = new Date().toISOString()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function loadProfile(): DeformationProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DeformationProfile
  } catch {
    return null
  }
}
