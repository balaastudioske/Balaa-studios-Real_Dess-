import * as THREE from 'three'

export interface StagePerformanceSurface {
  centerX: number
  centerY: number // Exact elevation of the performer deck surface
  centerZ: number
  stageWidth: number
  stageHeight: number
  stageDepth: number
  scale: number
  deckToRoofHeight: number
}

/**
 * Dynamically measures the actual 108-mesh stage GLB to identify:
 * 1. The highest prominent horizontal deck surface (where the artist stands)
 * 2. The stage center X / Z coordinates
 * 3. The exact world Y of the performance plane
 */
export function measureStagePerformancePlane(stageScene: THREE.Object3D): StagePerformanceSurface {

  // Compute raw overall bounds
  stageScene.updateMatrixWorld(true)
  const rawBounds = new THREE.Box3().setFromObject(stageScene)
  const rawSize = new THREE.Vector3()
  rawBounds.getSize(rawSize)
  const rawCenter = new THREE.Vector3()
  rawBounds.getCenter(rawCenter)

  // Sample vertices in the central performer zone (X within 25% of center, Z within 25% of center)
  // to find the actual performer deck plane elevation (excluding roof trusses)
  const deckYCandidates: number[] = []
  const v = new THREE.Vector3()

  stageScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const geom = mesh.geometry
      const pos = geom.attributes.position
      if (pos) {
        for (let i = 0; i < pos.count; i += 2) {
          v.fromBufferAttribute(pos, i)
          v.applyMatrix4(mesh.matrixWorld)
          // Look in central area and exclude extreme roof structures (> 65% height)
          const relY = (v.y - rawBounds.min.y) / (rawSize.y || 1)
          const relX = Math.abs(v.x - rawCenter.x) / (rawSize.x || 1)
          const relZ = Math.abs(v.z - rawCenter.z) / (rawSize.z || 1)

          if (relX < 0.25 && relZ < 0.25 && relY > 0.15 && relY < 0.60) {
            deckYCandidates.push(v.y)
          }
        }
      }
    }
  })

  // Determine the highest consistent deck elevation in the performance zone
  let rawDeckY = rawBounds.min.y + rawSize.y * 0.40 // fallback
  if (deckYCandidates.length > 0) {
    deckYCandidates.sort((a, b) => b - a)
    // Take the 90th percentile to avoid stray spike vertices while getting the top surface
    const idx = Math.floor(deckYCandidates.length * 0.10)
    rawDeckY = deckYCandidates[idx]
  }

  // Canonical concert scale: stage width ~18.5m, roof ceiling ~7.5m
  const targetStageWidth = 18.5
  const scale = targetStageWidth / Math.max(rawSize.x, 0.001)

  // Calculate scaled deck height and performance plane center
  const centerY = (rawDeckY - rawBounds.min.y) * scale
  const centerX = 0
  const centerZ = 0.5 // slightly forward of center for vocal performance

  return {
    centerX,
    centerY,
    centerZ,
    stageWidth: rawSize.x * scale,
    stageHeight: rawSize.y * scale,
    stageDepth: rawSize.z * scale,
    scale,
    deckToRoofHeight: (rawBounds.max.y - rawDeckY) * scale,
  }
}
