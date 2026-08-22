import * as THREE from 'three'

export type FingerDigit = 'Thumb' | 'Index' | 'Middle' | 'Ring' | 'Pinky'

export interface FingerChain {
  side: 'Left' | 'Right'
  digit: FingerDigit
  bones: string[]
}

/**
 * Canonical finger chains for the preserved 73-joint Dess skeleton. The
 * supplied BVH uses L Finger0…4; its thumb/index/middle/ring/little ordering
 * is normalized here before applying any secondary motion.
 */
export const DESS_FINGER_CHAINS: FingerChain[] = (['Left', 'Right'] as const).flatMap((side) =>
  (['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'] as const).map((digit) => ({
    side,
    digit,
    bones: [1, 2, 3].map((joint) => `${side}Hand${digit}${joint}`),
  })),
)

export const FINGER_CURL_WEIGHT: Record<FingerDigit, number> = {
  Thumb: 0.52,
  Index: 0.34,
  Middle: 0.78,
  Ring: 0.9,
  Pinky: 1,
}

export const FINGER_CURL_AXIS = new THREE.Vector3(0, 0, 1)
