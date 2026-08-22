/**
 * Space Parallax System — Layered Cosmic Parallax (v2)
 *
 * Implements layered cosmic depth:
 * - Distant Sun & Earth positioned for visible, gentle parallax drift during 360° orbit
 * - Skybox positioned at radius 3000, exempt from exponential fog (fog: false)
 * - Camera orbit enabled across full polar range [0.05, Math.PI - 0.05] and distance [4, 140]
 */

import * as THREE from 'three'

// ── Layer Definitions ──────────────────────────────────────────────

export interface ParallaxLayer {
  id: string
  distance: number
  baseSpeed: number
  items: BillboardItem[]
}

export interface BillboardItem {
  position: THREE.Vector3
  trueSize: number
  texture: string
  visualScaleBoost: number
  tumbleSpeed: number
}

// ── Parallax Math Formulas ─────────────────────────────────────────

export function getApparentSpeed(baseSpeed: number, distance: number): number {
  return baseSpeed / Math.max(distance, 0.01)
}

export function getProjectedSize(
  trueSize: number,
  distance: number,
  fov: number,
  viewportHeight: number,
  visualScaleBoost = 1
): number {
  const halfFovRad = THREE.MathUtils.degToRad(fov / 2)
  const screenFraction = trueSize / (2 * distance * Math.tan(halfFovRad))
  return screenFraction * viewportHeight * visualScaleBoost
}

export function getDepthCueFactor(distance: number, maxDistance: number): number {
  const t = Math.min(distance / Math.max(maxDistance, 1), 1)
  return Math.pow(1 - t, 1.5)
}

export function applyDepthCueing(
  baseColor: THREE.Color,
  distance: number,
  maxDistance: number,
  fogColor: THREE.Color = new THREE.Color(0x0c0d1e)
): THREE.Color {
  const factor = getDepthCueFactor(distance, maxDistance)
  const result = baseColor.clone()

  const hsl = { h: 0, s: 0, l: 0 }
  result.getHSL(hsl)
  hsl.s *= factor
  result.setHSL(hsl.h, hsl.s, hsl.l)

  result.lerp(fogColor, 1 - factor)
  return result
}

// ── v2 Layer Configuration ─────────────────────────────────────────

export const DEFAULT_SPACE_LAYERS: ParallaxLayer[] = [
  {
    id: 'skybox',
    distance: 3000,
    baseSpeed: 0.1,
    items: [],
  },
  {
    id: 'sun-layer',
    distance: 435, // sqrt(280^2 + 90^2 + (-320)^2)
    baseSpeed: 1.2,
    items: [
      {
        position: new THREE.Vector3(280, 90, -320),
        trueSize: 90,
        texture: '/textures/cartoon-sun.jpg',
        visualScaleBoost: 1.0,
        tumbleSpeed: 0,
      },
    ],
  },
  {
    id: 'earth-layer',
    distance: 398, // sqrt((-260)^2 + (-30)^2 + (-300)^2)
    baseSpeed: 1.5,
    items: [
      {
        position: new THREE.Vector3(-260, -30, -300),
        trueSize: 70,
        texture: '/textures/planet-earth.jpg',
        visualScaleBoost: 1.0,
        tumbleSpeed: 0,
      },
    ],
  },
]
