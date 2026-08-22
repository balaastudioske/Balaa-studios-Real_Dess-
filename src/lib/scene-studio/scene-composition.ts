/**
 * Scene Studio — Scene Composition State
 *
 * Manages the state of a composed scene: placed props with transforms,
 * backdrop color, lighting preset selection.
 */

import * as THREE from 'three'

export interface PlacedProp {
  /** Unique instance ID */
  instanceId: string
  /** Reference to the prop asset ID from the catalog */
  propId: string
  /** GLB path */
  glbPath: string
  /** Display name */
  name: string
  /** World transform */
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

export interface SceneComposition {
  /** Unique scene ID */
  id: string
  /** Human-readable label */
  name: string
  /** Stage/background color (hex) */
  backdropColor: string
  /** All placed props in this scene */
  props: PlacedProp[]
  /** Timestamp */
  createdAt: string
  updatedAt: string
}

/**
 * Create an empty scene composition.
 */
export function createEmptyScene(name = 'Untitled Scene'): SceneComposition {
  return {
    id: `scene-${Date.now().toString(36)}`,
    name,
    backdropColor: '#09090b',
    props: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Add a prop to a scene.
 */
export function addPropToScene(
  scene: SceneComposition,
  propId: string,
  glbPath: string,
  name: string,
  position: [number, number, number] = [0, 0, 0]
): SceneComposition {
  const instanceId = `inst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  return {
    ...scene,
    props: [
      ...scene.props,
      {
        instanceId,
        propId,
        glbPath,
        name,
        position,
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    ],
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Update a prop's transform in a scene.
 */
export function updatePropTransform(
  scene: SceneComposition,
  instanceId: string,
  patch: Partial<Pick<PlacedProp, 'position' | 'rotation' | 'scale'>>
): SceneComposition {
  return {
    ...scene,
    props: scene.props.map((p) =>
      p.instanceId === instanceId ? { ...p, ...patch } : p
    ),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Remove a prop from a scene.
 */
export function removePropFromScene(
  scene: SceneComposition,
  instanceId: string
): SceneComposition {
  return {
    ...scene,
    props: scene.props.filter((p) => p.instanceId !== instanceId),
    updatedAt: new Date().toISOString(),
  }
}
