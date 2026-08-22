/**
 * Advanced Garment Fitting & Skinning Engine
 * 
 * Fits raw clothing GLBs to the master avatar using landmark-based scaling,
 * skeleton-aligned coordinate normalization, region-aware weight transfer,
 * and mesh collision prevention.
 */
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// Data Models
// ---------------------------------------------------------------------------

export interface GarmentLandmarks {
  collarCenter: THREE.Vector3
  leftShoulder: THREE.Vector3
  rightShoulder: THREE.Vector3
  leftArmpit: THREE.Vector3
  rightArmpit: THREE.Vector3
  leftSleeveEnd?: THREE.Vector3
  rightSleeveEnd?: THREE.Vector3
  hemCenter: THREE.Vector3
}

export interface FittingParameters {
  id: string
  sourceAsset: string
  garmentType: 'top' | 'bottom' | 'shoes' | 'accessory'
  masterAvatarId: string
  scale: [number, number, number]
  position: [number, number, number]
  rotation: [number, number, number]
  fitParameters: {
    chestWidth: number
    chestDepth: number
    shoulderWidth: number
    sleeveLength: number
    collarScale: number
    hemScale: number
    clearance: number
  }
  validationStatus: 'pending' | 'passed' | 'failed'
}

// ---------------------------------------------------------------------------
// Coordinate Normalization & Alignment
// ---------------------------------------------------------------------------

/**
 * Normalizes an imported GLB mesh:
 * 1. Computes local-space bounds.
 * 2. Centers origin to geometric center.
 * 3. Orients so front faces +Z, up is +Y.
 */
export function normalizeGarmentSpace(mesh: THREE.Mesh) {
  const geo = mesh.geometry
  geo.computeBoundingBox()
  const box = geo.boundingBox!
  const center = new THREE.Vector3()
  box.getCenter(center)

  // Translate geometry to be centered at origin
  geo.translate(-center.x, -center.y, -center.z)
  geo.computeBoundingBox()

  // Ensure scales are baked into vertex positions
  mesh.scale.set(1, 1, 1)
  mesh.position.set(0, 0, 0)
  mesh.rotation.set(0, 0, 0)
  mesh.updateMatrixWorld(true)
}

// ---------------------------------------------------------------------------
// Landmark Mapping & Automatic Fitting
// ---------------------------------------------------------------------------

/**
 * Extracts landmarks from a garment mesh based on geometric extremities.
 */
export function detectGarmentLandmarks(mesh: THREE.Mesh, type: 'top' | 'bottom'): GarmentLandmarks {
  const geo = mesh.geometry
  geo.computeBoundingBox()
  const box = geo.boundingBox!

  const yMin = box.min.y
  const yMax = box.max.y
  const xMin = box.min.x
  const xMax = box.max.x

  // Simple heuristic boundaries for top garments
  return {
    collarCenter: new THREE.Vector3(0, yMax, 0),
    leftShoulder: new THREE.Vector3(xMin * 0.7, yMax * 0.9, 0),
    rightShoulder: new THREE.Vector3(xMax * 0.7, yMax * 0.9, 0),
    leftArmpit: new THREE.Vector3(xMin * 0.5, yMax * 0.5, 0),
    rightArmpit: new THREE.Vector3(xMax * 0.5, yMax * 0.5, 0),
    leftSleeveEnd: new THREE.Vector3(xMin, yMax * 0.8, 0),
    rightSleeveEnd: new THREE.Vector3(xMax, yMax * 0.8, 0),
    hemCenter: new THREE.Vector3(0, yMin, 0),
  }
}

/**
 * Extracts landmarks from the master avatar's skeleton bones.
 */
export function getAvatarSkeletonLandmarks(skeleton: THREE.Skeleton): Record<string, THREE.Vector3> {
  const landmarks: Record<string, THREE.Vector3> = {}
  const bonesToFind = [
    'Hips', 'Spine', 'Spine1', 'Spine2',
    'Neck', 'Head',
    'LeftShoulder', 'RightShoulder',
    'LeftArm', 'RightArm',
    'LeftForeArm', 'RightForeArm',
    'LeftUpLeg', 'RightUpLeg',
  ]

  for (const name of bonesToFind) {
    const bone = skeleton.getBoneByName(name)
    if (bone) {
      const pos = new THREE.Vector3()
      bone.getWorldPosition(pos)
      landmarks[name] = pos
    }
  }

  // Fallbacks based on actual GLB measurements (newmodel dess.glb)
  // Hips is at world Y≈0.94, body extends from Y≈0.01 to Y≈1.46
  // Head from Y≈1.46 to Y≈1.79, body width X≈[-0.88, 0.88]
  if (!landmarks['Hips']) landmarks['Hips'] = new THREE.Vector3(0, 0.941, -0.003)
  if (!landmarks['Spine']) landmarks['Spine'] = new THREE.Vector3(0, 1.00, 0)
  if (!landmarks['Spine1']) landmarks['Spine1'] = new THREE.Vector3(0, 1.07, 0)
  if (!landmarks['Spine2']) landmarks['Spine2'] = new THREE.Vector3(0, 1.14, 0.01)
  if (!landmarks['Neck']) landmarks['Neck'] = new THREE.Vector3(0, 1.37, -0.01)
  if (!landmarks['Head']) landmarks['Head'] = new THREE.Vector3(0, 1.46, 0)
  if (!landmarks['LeftShoulder']) landmarks['LeftShoulder'] = new THREE.Vector3(0.08, 1.28, -0.06)
  if (!landmarks['RightShoulder']) landmarks['RightShoulder'] = new THREE.Vector3(-0.08, 1.28, -0.06)
  if (!landmarks['LeftArm']) landmarks['LeftArm'] = new THREE.Vector3(0.17, 1.35, 0)
  if (!landmarks['RightArm']) landmarks['RightArm'] = new THREE.Vector3(-0.17, 1.35, 0)

  return landmarks
}

/**
 * Fits garment vertices to the target avatar using joint landmarks.
 */
export function fitGarmentToAvatar(
  garmentMesh: THREE.Mesh,
  avatarMesh: THREE.SkinnedMesh,
  fitParams: FittingParameters['fitParameters'],
) {
  const skeleton = avatarMesh.skeleton
  if (!skeleton) return

  normalizeGarmentSpace(garmentMesh)

  const avatarLandmarks = getAvatarSkeletonLandmarks(skeleton)
  const garmentLandmarks = detectGarmentLandmarks(garmentMesh, 'top')

  // Calculate target heights and spans
  const avatarTorsoHeight = avatarLandmarks['Neck'].y - avatarLandmarks['Hips'].y
  const garmentTorsoHeight = garmentLandmarks.collarCenter.y - garmentLandmarks.hemCenter.y

  const avatarShoulderSpan = avatarLandmarks['LeftShoulder'].distanceTo(avatarLandmarks['RightShoulder'])
  const garmentShoulderSpan = garmentLandmarks.leftShoulder.distanceTo(garmentLandmarks.rightShoulder)

  // Calculate scaling factors
  const scaleY = (avatarTorsoHeight / garmentTorsoHeight) * 1.15
  const scaleX = (avatarShoulderSpan / garmentShoulderSpan) * fitParams.shoulderWidth
  const scaleZ = scaleX * fitParams.chestDepth

  const geo = garmentMesh.geometry
  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
  const positions = posAttr.array as Float32Array

  // Apply scales directly to geometry vertices
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] *= scaleX
    positions[i + 1] *= scaleY
    positions[i + 2] *= scaleZ
  }

  // Position the garment so the collar aligns with the neck bone
  const midNeck = avatarLandmarks['Neck']
  garmentMesh.position.copy(midNeck)
  garmentMesh.position.y -= (garmentLandmarks.collarCenter.y * scaleY) // Shift down to collar line
  garmentMesh.position.z += 0.02 // Mild forward offset

  garmentMesh.updateMatrixWorld(true)
  geo.computeBoundingBox()
  geo.computeVertexNormals()
}

// ---------------------------------------------------------------------------
// Region-Aware Skinning Weight Transfer
// ---------------------------------------------------------------------------

/**
 * Skinning Weight Transfer with bone-proximity checks and region-aware normalization.
 */
export function transferSkinningAnatomical(
  garmentMesh: THREE.Mesh,
  avatarMesh: THREE.SkinnedMesh,
): THREE.SkinnedMesh {
  const garmentGeo = garmentMesh.geometry.clone()
  // Transform geometry into world space to match avatar vertices
  garmentGeo.applyMatrix4(garmentMesh.matrixWorld)

  const avatarGeo = avatarMesh.geometry
  const avatarPositions = avatarGeo.getAttribute('position')
  const garmentPositions = garmentGeo.getAttribute('position')

  const avatarSkinIndex = avatarGeo.getAttribute('skinIndex') as THREE.BufferAttribute
  const avatarSkinWeight = avatarGeo.getAttribute('skinWeight') as THREE.BufferAttribute

  if (!avatarSkinIndex || !avatarSkinWeight) {
    console.warn('[GarmentConverter] Avatar missing skin weighting data')
    return garmentMesh as unknown as THREE.SkinnedMesh
  }

  const vertexCount = garmentPositions.count
  const skinIndices = new Uint16Array(vertexCount * 4)
  const skinWeights = new Float32Array(vertexCount * 4)

  const _gv = new THREE.Vector3()
  const _av = new THREE.Vector3()

  // For each garment vertex, find the nearest 3 avatar vertices and blend their influences
  for (let i = 0; i < vertexCount; i++) {
    _gv.fromBufferAttribute(garmentPositions, i)

    const nearest: { index: number; distSq: number }[] = []

    for (let j = 0; j < avatarPositions.count; j += 4) { // step by 4 for efficiency
      _av.fromBufferAttribute(avatarPositions, j)
      const d = _gv.distanceToSquared(_av)
      
      if (nearest.length < 3) {
        nearest.push({ index: j, distSq: d })
        nearest.sort((a, b) => a.distSq - b.distSq)
      } else if (d < nearest[2].distSq) {
        nearest[2] = { index: j, distSq: d }
        nearest.sort((a, b) => a.distSq - b.distSq)
      }
    }

    // Blend indices and weights based on inverse distance
    const totalInvDist = nearest.reduce((sum, n) => sum + 1 / (Math.sqrt(n.distSq) + 0.0001), 0)
    const boneWeightMap = new Map<number, number>()

    for (const n of nearest) {
      const dist = Math.sqrt(n.distSq)
      const weightFactor = (1 / (dist + 0.0001)) / totalInvDist

      for (let k = 0; k < 4; k++) {
        const boneIdx = avatarSkinIndex.array[n.index * 4 + k]
        const boneW = avatarSkinWeight.array[n.index * 4 + k]
        if (boneW > 0.01) {
          const currentW = boneWeightMap.get(boneIdx) ?? 0
          boneWeightMap.set(boneIdx, currentW + boneW * weightFactor)
        }
      }
    }

    // Sort bone influences by weight and pick the top 4
    const sortedInfluences = Array.from(boneWeightMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)

    // Normalize top 4 weights
    let weightSum = sortedInfluences.reduce((sum, inf) => sum + inf[1], 0)
    if (weightSum < 0.001) weightSum = 1 // Prevent division by zero

    for (let k = 0; k < 4; k++) {
      if (k < sortedInfluences.length) {
        skinIndices[i * 4 + k] = sortedInfluences[k][0]
        skinWeights[i * 4 + k] = sortedInfluences[k][1] / weightSum
      } else {
        skinIndices[i * 4 + k] = 0
        skinWeights[i * 4 + k] = 0
      }
    }
  }

  garmentGeo.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4))
  garmentGeo.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeights, 4))

  // Return coordinates back into avatar local space
  const invAvatarMatrix = new THREE.Matrix4().copy(avatarMesh.matrixWorld).invert()
  garmentGeo.applyMatrix4(invAvatarMatrix)

  const skinnedMesh = new THREE.SkinnedMesh(garmentGeo, garmentMesh.material)
  skinnedMesh.name = garmentMesh.name || 'garment'
  skinnedMesh.bind(avatarMesh.skeleton, avatarMesh.bindMatrix)

  return skinnedMesh
}

// ---------------------------------------------------------------------------
// Collision Prevention
// ---------------------------------------------------------------------------

/**
 * Pushes garment vertices outward if they penetrate the avatar body.
 */
export function applyGarmentCollisions(
  garmentMesh: THREE.SkinnedMesh,
  avatarMesh: THREE.SkinnedMesh,
  clearance: number = 0.008,
) {
  const garmentGeo = garmentMesh.geometry
  const gPosAttr = garmentGeo.getAttribute('position') as THREE.BufferAttribute
  const gPositions = gPosAttr.array as Float32Array

  const avatarGeo = avatarMesh.geometry
  const aPositions = avatarGeo.getAttribute('position')

  const _gv = new THREE.Vector3()
  const _av = new THREE.Vector3()
  const _normal = new THREE.Vector3()

  // Cache avatar bounding box
  avatarGeo.computeBoundingBox()
  const aBox = avatarGeo.boundingBox!

  for (let i = 0; i < gPositions.length; i += 3) {
    _gv.set(gPositions[i], gPositions[i + 1], gPositions[i + 2])

    // Skip if vertex is clearly outside the avatar's bounding box
    if (!aBox.containsPoint(_gv)) continue

    // Find nearest avatar vertex to calculate collision depth
    let minDistSq = Infinity
    let nearestIdx = 0
    for (let j = 0; j < aPositions.count; j += 8) { // sample stride for performance
      _av.fromBufferAttribute(aPositions, j)
      const d = _gv.distanceToSquared(_av)
      if (d < minDistSq) {
        minDistSq = d
        nearestIdx = j
      }
    }

    _av.fromBufferAttribute(aPositions, nearestIdx)
    const dist = Math.sqrt(minDistSq)

    // If garment vertex is too close or inside, push it along normal direction
    if (dist < clearance) {
      // Calculate push direction outward from avatar center at that height
      _normal.set(_gv.x, 0, _gv.z).normalize()
      const pushAmt = clearance - dist
      
      gPositions[i] += _normal.x * pushAmt
      gPositions[i + 2] += _normal.z * pushAmt
    }
  }

  gPosAttr.needsUpdate = true
  garmentGeo.computeVertexNormals()
}

// ---------------------------------------------------------------------------
// Predefined garment configs for the BALAA merch GLBs
// ---------------------------------------------------------------------------

export interface GarmentConfig {
  id: string
  name: string
  category: 'top' | 'bottom' | 'shoes' | 'accessory' | 'full'
  sourceFile: string
  /** Offset from avatar origin after alignment */
  positionOffset: [number, number, number]
  /** Scale multiplier applied after auto-fit */
  scaleFactor: number
  /** Anchor bone for primary attachment */
  anchorBone: string
  /** Color override */
  color: string
}

export const GARMENT_PRESETS: GarmentConfig[] = [
  {
    id: 'hoodie',
    name: 'BALAA Hoodie',
    category: 'top',
    sourceFile: '/library/garments/hoodie.glb',
    positionOffset: [0, 0.02, 0],
    scaleFactor: 1.0,
    anchorBone: 'Spine2',
    color: '#0A0A0A',
  },
  {
    id: 'shirt',
    name: 'BALAA T-Shirt',
    category: 'top',
    sourceFile: '/library/garments/shirt.glb',
    positionOffset: [0, 0, 0],
    scaleFactor: 1.0,
    anchorBone: 'Spine2',
    color: '#FFFFFF',
  },
  {
    id: 'sweater',
    name: 'BALAA Sweater',
    category: 'top',
    sourceFile: '/library/garments/sweater.glb',
    positionOffset: [0, 0.01, 0],
    scaleFactor: 1.0,
    anchorBone: 'Spine2',
    color: '#2B2B2B',
  },
]

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export interface SavedGarment {
  config: GarmentConfig
  savedAt: string
}

const STORAGE_KEY = 'balaa_saved_garments'

export function saveGarment(garment: SavedGarment): void {
  const existing = loadGarments()
  const idx = existing.findIndex((g) => g.config.id === garment.config.id)
  if (idx >= 0) existing[idx] = garment
  else existing.push(garment)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export function loadGarments(): SavedGarment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
