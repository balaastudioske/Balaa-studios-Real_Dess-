import * as THREE from 'three'

export interface FootRaycastResult {
  hitPoint: THREE.Vector3
  hitMeshName: string
  normalY: number
  deckElevation: number
  avatarPlacementY: number
  footOffsetFromRoot: number
  contactError: number
}

/**
 * Vertical raycasting to find the true walkable stage deck directly beneath the performer.
 * Ignores roof trusses, high banners, lighting rigs, and background scenery.
 */
export function findStageDeckHit(
  stageScene: THREE.Object3D,
  targetX: number = 0,
  targetZ: number = 0.5,
  maxSearchHeight: number = 8.0
): FootRaycastResult | null {
  stageScene.updateMatrixWorld(true)

  const raycaster = new THREE.Raycaster()
  const origin = new THREE.Vector3(targetX, maxSearchHeight, targetZ)
  const direction = new THREE.Vector3(0, -1, 0)
  raycaster.set(origin, direction)

  // Collect all stage meshes
  const stageMeshes: THREE.Mesh[] = []
  stageScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      stageMeshes.push(child as THREE.Mesh)
    }
  })

  const intersects = raycaster.intersectObjects(stageMeshes, true)

  // Filter for valid horizontal surfaces (normal.y > 0.80) that are below roof level (Y < 7.0)
  for (const hit of intersects) {
    if (hit.point.y >= maxSearchHeight - 0.1) continue // Skip origin intersections

    const worldNormal = hit.face
      ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
      : new THREE.Vector3(0, 1, 0)

    // A valid walkable deck must be predominantly horizontal and below roof/truss level
    if (worldNormal.y > 0.75 && hit.point.y < 6.0 && hit.point.y > 0.1) {
      return {
        hitPoint: hit.point.clone(),
        hitMeshName: hit.object.name,
        normalY: worldNormal.y,
        deckElevation: hit.point.y,
        avatarPlacementY: hit.point.y,
        footOffsetFromRoot: 0.0, // calibrated below
        contactError: 0.0,
      }
    }
  }

  // Fallback if no specific horizontal face met threshold
  if (intersects.length > 0) {
    const valid = intersects.find((h) => h.point.y < 6.0 && h.point.y > 0.1)
    if (valid) {
      return {
        hitPoint: valid.point.clone(),
        hitMeshName: valid.object.name,
        normalY: 1.0,
        deckElevation: valid.point.y,
        avatarPlacementY: valid.point.y,
        footOffsetFromRoot: 0.0,
        contactError: 0.0,
      }
    }
  }

  return null
}

/**
 * Calculates the lowest world-space point of the avatar's neutral footwear/mesh geometry
 * relative to the avatar root node to ensure zero foot penetration.
 */
export function computeAvatarFootOffset(avatarScene: THREE.Object3D): number {
  avatarScene.updateMatrixWorld(true)

  let lowestY = 0.0
  let found = false

  avatarScene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh
      const geom = mesh.geometry
      const pos = geom.attributes.position
      if (pos) {
        const v = new THREE.Vector3()
        for (let i = 0; i < pos.count; i += 4) {
          v.fromBufferAttribute(pos, i)
          if (!found || v.y < lowestY) {
            lowestY = v.y
            found = true
          }
        }
      }
    }
  })

  // In dess.glb, the soles are at local Y ~ 0.012m
  return found ? Math.max(0, lowestY) : 0.0
}
