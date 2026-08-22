import * as THREE from 'three'
import stageConfig from '../../public/library/stages/stage-constraints.json'

export interface StageBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  groundY: number
}

export interface StageDimensions {
  width: number
  depth: number
  floorTopY: number
  roofBottomY: number
  pillarPositions: [number, number, number][]
}

export const STAGE_CONFIG = stageConfig

export const STAGE_BOUNDS: StageBounds = stageConfig.performerConstraints.bounds
export const STAGE_DIMENSIONS: StageDimensions = stageConfig.dimensions as StageDimensions

/**
 * Constrains any 3D position to stay strictly within the flat stage bounds.
 * Guarantees Y remains clamped exactly to the flat stage floor (Y = 0).
 */
export function constrainPerformerPosition(
  currentPos: THREE.Vector3,
  margin: number = 0.0
): THREE.Vector3 {
  const clampedX = THREE.MathUtils.clamp(
    currentPos.x,
    STAGE_BOUNDS.minX + margin,
    STAGE_BOUNDS.maxX - margin
  )
  const clampedZ = THREE.MathUtils.clamp(
    currentPos.z,
    STAGE_BOUNDS.minZ + margin,
    STAGE_BOUNDS.maxZ - margin
  )
  return new THREE.Vector3(clampedX, STAGE_BOUNDS.groundY, clampedZ)
}

/**
 * Checks if a target coordinate is within the allowed stage boundary.
 */
export function isWithinStageBounds(x: number, z: number, margin: number = 0.0): boolean {
  return (
    x >= STAGE_BOUNDS.minX + margin &&
    x <= STAGE_BOUNDS.maxX - margin &&
    z >= STAGE_BOUNDS.minZ + margin &&
    z <= STAGE_BOUNDS.maxZ - margin
  )
}
