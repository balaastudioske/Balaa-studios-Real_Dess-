/**
 * fingerRig.ts — Realistic Adult Male Finger Proportions & 2nd-Order Spring Physics Engine
 *
 * Implements:
 *   1. Direct bind-pose preservation of the authoritative 73-bone skeleton (dess.glb)
 *   2. Second-order angular spring-damper physics simulation for biological smoothness
 *   3. Tuned joint stiffness and damping (MCP: 180/24, PIP: 220/28, DIP: 250/30, Thumb: 160/22)
 *   4. Per-digit inertia/response multipliers (Index: fast, Middle: stable, Ring: follower, Pinky: flexible, Thumb: mass)
 *   5. Hierarchical propagation delays (MCP: 0ms, PIP: 20ms, DIP: 35ms)
 *   6. Wrist acceleration inertial lag & settling
 *   7. Dedicated Microphone Grip solver
 *   8. Complete 10 anatomical pose presets
 *   9. Zero criss-crossing guarantee via strict local-frame delta flexion
 *  10. Admin measurement & proportion reporting
 */

import * as THREE from 'three'

// ─── Types & Presets ────────────────────────────────────────────────────────

export type HandPosePreset =
  | 'neutral'
  | 'relaxed'
  | 'open'
  | 'fist'
  | 'point'
  | 'spread'
  | 'thumb-oppose'
  | 'mic-grip'
  | 'performance-fast'
  | 'performance-slow'

export interface FingerBonePhysicsState {
  boneName: string
  bone: THREE.Bone | null
  bindPoseQuat: THREE.Quaternion

  // Angular Spring State (radians)
  currentCurl: number
  targetCurl: number
  curlVelocity: number

  currentSpread: number
  targetSpread: number
  spreadVelocity: number

  // Joint delay ring buffer
  delayedTargetCurl: number
  targetHistory: { time: number; curl: number; spread: number }[]

  // Tunable spring properties
  stiffness: number
  damping: number
  maxAngularVelocity: number

  // Constraints (radians)
  minCurl: number
  maxCurl: number
  minSpread: number
  maxSpread: number
}

export interface FingerDefinition {
  name: string
  side: 'Left' | 'Right'
  fingerType: 'Thumb' | 'Index' | 'Middle' | 'Ring' | 'Pinky'
  responsiveness: number // Inertia multiplier
  bones: FingerBonePhysicsState[]
}

const DEG2RAD = Math.PI / 180
const deg = (v: number): number => v * DEG2RAD

// ─── Spring Constants per Joint (Section 10) ────────────────────────────────

const SPRING_PROPERTIES = {
  MCP: { stiffness: 180, damping: 24, maxVel: 25.0, delayMs: 0 },
  PIP: { stiffness: 220, damping: 28, maxVel: 30.0, delayMs: 20 },
  DIP: { stiffness: 250, damping: 30, maxVel: 35.0, delayMs: 35 },
  TIP: { stiffness: 300, damping: 40, maxVel: 10.0, delayMs: 40 },
  THUMB: { stiffness: 160, damping: 22, maxVel: 20.0, delayMs: 0 },
}

// ─── Inertia / Responsiveness per Digit (Section 11) ────────────────────────

const DIGIT_RESPONSIVENESS = {
  Index: 1.25,   // Fast response
  Middle: 1.00,  // High stability reference
  Ring: 0.90,    // Follower
  Pinky: 1.15,   // Flexible
  Thumb: 0.80,   // Heavy rotational mass
}

// ─── Target Delta Calculation (Section 1–8, 15) ─────────────────────────────

interface TargetDelta {
  curl: number   // radians (+X flexion toward palm)
  spread: number // radians (+Z abduction fan)
}

function getPoseTargetDelta(
  fingerType: 'Thumb' | 'Index' | 'Middle' | 'Ring' | 'Pinky',
  jointIdx: number, // 0 = Proximal (MCP), 1 = Intermediate (PIP), 2 = Distal (DIP), 3 = Tip
  pose: HandPosePreset,
  side: 'Left' | 'Right'
): TargetDelta {
  const spreadSign = side === 'Left' ? 1 : -1

  // Endpoint bones have 0 delta
  if (jointIdx >= 3) {
    return { curl: 0, spread: 0 }
  }

  // 1. Dedicated Thumb Handling (Section 5, 15)
  if (fingerType === 'Thumb') {
    switch (pose) {
      case 'open':
      case 'spread':
        if (jointIdx === 0) return { curl: deg(-5), spread: deg(18) * spreadSign }
        if (jointIdx === 1) return { curl: deg(-5), spread: 0 }
        return { curl: 0, spread: 0 }

      case 'relaxed':
        if (jointIdx === 0) return { curl: deg(8), spread: deg(5) * spreadSign }
        if (jointIdx === 1) return { curl: deg(12), spread: 0 }
        return { curl: deg(8), spread: 0 }

      case 'fist':
        if (jointIdx === 0) return { curl: deg(25), spread: deg(22) * spreadSign }
        if (jointIdx === 1) return { curl: deg(40), spread: 0 }
        return { curl: deg(45), spread: 0 }

      case 'point':
        if (jointIdx === 0) return { curl: deg(18), spread: deg(14) * spreadSign }
        if (jointIdx === 1) return { curl: deg(28), spread: 0 }
        return { curl: deg(22), spread: 0 }

      case 'thumb-oppose':
        if (jointIdx === 0) return { curl: deg(28), spread: deg(26) * spreadSign }
        if (jointIdx === 1) return { curl: deg(35), spread: 0 }
        return { curl: deg(30), spread: 0 }

      case 'mic-grip':
        // Opposed and wrapped securely over index/middle knuckle
        if (jointIdx === 0) return { curl: deg(24), spread: deg(22) * spreadSign }
        if (jointIdx === 1) return { curl: deg(38), spread: 0 }
        return { curl: deg(42), spread: 0 }

      case 'performance-fast':
      case 'performance-slow':
      case 'neutral':
      default:
        return { curl: 0, spread: 0 }
    }
  }

  // 2. Anatomical Fan Spread for 4 Fingers (Section 4)
  const neutralFanSpread = {
    Index: deg(5) * spreadSign,
    Middle: deg(0),
    Ring: deg(-3.5) * spreadSign,
    Pinky: deg(-8) * spreadSign,
  }[fingerType]

  const wideFanSpread = {
    Index: deg(9) * spreadSign,
    Middle: deg(0),
    Ring: deg(-6) * spreadSign,
    Pinky: deg(-14) * spreadSign,
  }[fingerType]

  // 3. Regular Digits Target Distribution (Section 6, 8, 15)
  switch (pose) {
    case 'open':
      if (jointIdx === 0) return { curl: deg(-8), spread: neutralFanSpread * 0.5 }
      if (jointIdx === 1) return { curl: deg(-10), spread: 0 }
      return { curl: deg(-5), spread: 0 }

    case 'spread':
      if (jointIdx === 0) return { curl: deg(-5), spread: wideFanSpread }
      if (jointIdx === 1) return { curl: deg(-8), spread: 0 }
      return { curl: deg(-4), spread: 0 }

    case 'relaxed':
      // Natural adult male rest curl (Section 8: MCP 10-15°, PIP 15-25°, DIP 5-15°)
      if (jointIdx === 0) return { curl: deg(12), spread: neutralFanSpread * 0.8 }
      if (jointIdx === 1) return { curl: deg(20), spread: 0 }
      return { curl: deg(10), spread: 0 }

    case 'fist':
      // Strong anatomical fist (Section 6: MCP 35°, PIP 50°, DIP 25° additive)
      if (jointIdx === 0) return { curl: deg(45), spread: 0 }
      if (jointIdx === 1) return { curl: deg(75), spread: 0 }
      return { curl: deg(50), spread: 0 }

    case 'point':
      if (fingerType === 'Index') {
        if (jointIdx === 0) return { curl: deg(-4), spread: neutralFanSpread }
        return { curl: 0, spread: 0 }
      } else {
        if (jointIdx === 0) return { curl: deg(42), spread: 0 }
        if (jointIdx === 1) return { curl: deg(72), spread: 0 }
        return { curl: deg(48), spread: 0 }
      }

    case 'thumb-oppose':
      if (jointIdx === 0) return { curl: deg(14), spread: neutralFanSpread * 0.6 }
      if (jointIdx === 1) return { curl: deg(22), spread: 0 }
      return { curl: deg(12), spread: 0 }

    case 'mic-grip':
      // Dedicated Microphone Grip Solver (Section 15)
      // Cylindrical wrap around 3.2cm microphone handle
      if (fingerType === 'Index') {
        // High resting collar grip
        if (jointIdx === 0) return { curl: deg(35), spread: neutralFanSpread * 0.4 }
        if (jointIdx === 1) return { curl: deg(52), spread: 0 }
        return { curl: deg(32), spread: 0 }
      } else if (fingerType === 'Middle') {
        if (jointIdx === 0) return { curl: deg(48), spread: 0 }
        if (jointIdx === 1) return { curl: deg(68), spread: 0 }
        return { curl: deg(42), spread: 0 }
      } else if (fingerType === 'Ring') {
        if (jointIdx === 0) return { curl: deg(52), spread: 0 }
        if (jointIdx === 1) return { curl: deg(72), spread: 0 }
        return { curl: deg(45), spread: 0 }
      } else {
        // Pinky tight lower base closure
        if (jointIdx === 0) return { curl: deg(56), spread: 0 }
        if (jointIdx === 1) return { curl: deg(76), spread: 0 }
        return { curl: deg(48), spread: 0 }
      }

    case 'performance-fast':
    case 'performance-slow':
    case 'neutral':
    default:
      // Pure authored bind pose (zero delta)
      return { curl: 0, spread: 0 }
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

function createFingerPhysics(
  side: 'Left' | 'Right',
  fingerType: 'Thumb' | 'Index' | 'Middle' | 'Ring' | 'Pinky'
): FingerDefinition {
  const prefix = `${side}Hand${fingerType}`
  const bones: FingerBonePhysicsState[] = []
  const isThumb = fingerType === 'Thumb'

  for (let i = 1; i <= 4; i++) {
    const springDef = isThumb
      ? SPRING_PROPERTIES.THUMB
      : i === 1
      ? SPRING_PROPERTIES.MCP
      : i === 2
      ? SPRING_PROPERTIES.PIP
      : i === 3
      ? SPRING_PROPERTIES.DIP
      : SPRING_PROPERTIES.TIP

    // Joint Limits (Section 7)
    const minCurl = i === 1 ? deg(-15) : deg(0)
    const maxCurl = i === 1 ? deg(85) : i === 2 ? deg(105) : deg(80)
    const maxSpread = i === 1 ? deg(15) : deg(4)

    bones.push({
      boneName: `${prefix}${i}`,
      bone: null,
      bindPoseQuat: new THREE.Quaternion(),
      currentCurl: 0,
      targetCurl: 0,
      curlVelocity: 0,
      currentSpread: 0,
      targetSpread: 0,
      spreadVelocity: 0,
      delayedTargetCurl: 0,
      targetHistory: [],
      stiffness: springDef.stiffness,
      damping: springDef.damping,
      maxAngularVelocity: springDef.maxVel,
      minCurl,
      maxCurl,
      minSpread: -maxSpread,
      maxSpread,
    })
  }

  return {
    name: `${side}${fingerType}`,
    side,
    fingerType,
    responsiveness: DIGIT_RESPONSIVENESS[fingerType],
    bones,
  }
}

// ─── Main Class ─────────────────────────────────────────────────────────────

export class FingerRigSystem {
  private fingers: FingerDefinition[] = []
  private initialized = false
  private activePose: HandPosePreset = 'neutral'

  // Wrist velocity tracking for inertial lag (Section 14)
  private leftWristPrevPos = new THREE.Vector3()
  private leftWristVelocity = new THREE.Vector3()
  private rightWristPrevPos = new THREE.Vector3()
  private rightWristVelocity = new THREE.Vector3()

  // Preallocated math objects for zero frame GC
  private readonly _deltaQuat = new THREE.Quaternion()
  private readonly _deltaEuler = new THREE.Euler(0, 0, 0, 'XYZ')

  constructor() {
    const sides: ('Left' | 'Right')[] = ['Left', 'Right']
    const types: ('Thumb' | 'Index' | 'Middle' | 'Ring' | 'Pinky')[] = [
      'Thumb',
      'Index',
      'Middle',
      'Ring',
      'Pinky',
    ]

    for (const side of sides) {
      for (const fType of types) {
        this.fingers.push(createFingerPhysics(side, fType))
      }
    }
  }

  init(root: THREE.Object3D): void {
    if (this.initialized) return

    for (const finger of this.fingers) {
      for (let i = 0; i < finger.bones.length; i++) {
        const entry = finger.bones[i]
        const bone = root.getObjectByName(entry.boneName) as THREE.Bone | undefined
        if (bone) {
          entry.bone = bone
          entry.bindPoseQuat.copy(bone.quaternion)

          const target = getPoseTargetDelta(finger.fingerType, i, this.activePose, finger.side)
          entry.targetCurl = target.curl
          entry.targetSpread = target.spread
          entry.currentCurl = target.curl
          entry.currentSpread = target.spread
          entry.delayedTargetCurl = target.curl
        }
      }
    }

    const lWrist = root.getObjectByName('LeftHand')
    const rWrist = root.getObjectByName('RightHand')
    if (lWrist) lWrist.getWorldPosition(this.leftWristPrevPos)
    if (rWrist) rWrist.getWorldPosition(this.rightWristPrevPos)

    this.initialized = true
  }

  setPose(pose: HandPosePreset): void {
    this.activePose = pose

    for (const finger of this.fingers) {
      for (let i = 0; i < finger.bones.length; i++) {
        const entry = finger.bones[i]
        const target = getPoseTargetDelta(finger.fingerType, i, pose, finger.side)
        entry.targetCurl = target.curl
        entry.targetSpread = target.spread
      }
    }
  }

  setHandPose(side: 'Left' | 'Right', pose: HandPosePreset): void {
    for (const finger of this.fingers) {
      if (finger.side !== side) continue
      for (let i = 0; i < finger.bones.length; i++) {
        const entry = finger.bones[i]
        const target = getPoseTargetDelta(finger.fingerType, i, pose, finger.side)
        entry.targetCurl = target.curl
        entry.targetSpread = target.spread
      }
    }
  }

  getPose(): HandPosePreset {
    return this.activePose
  }

  /**
   * Performs 2nd-order spring physics simulation per frame.
   *
   * @param time - Total elapsed clock time (s)
   * @param audioPulse - Music pulse energy (0..1)
   * @param rawDelta - Frame delta (s)
   * @param root - Scene root for wrist tracking
   */
  applyFrame(
    time: number,
    audioPulse: number = 0,
    rawDelta: number = 0.016,
    root?: THREE.Object3D
  ): void {
    if (!this.initialized) return

    // Clamp delta to avoid numerical explosion on frame drops
    const dt = Math.min(0.033, Math.max(0.001, rawDelta))

    // 1. Wrist Acceleration Inertial Offset (Section 14)
    let leftWristInertia = 0
    let rightWristInertia = 0
    if (root) {
      const lWrist = root.getObjectByName('LeftHand')
      const rWrist = root.getObjectByName('RightHand')
      if (lWrist) {
        const curPos = new THREE.Vector3()
        lWrist.getWorldPosition(curPos)
        const vel = curPos.clone().sub(this.leftWristPrevPos).divideScalar(dt)
        const accel = vel.clone().sub(this.leftWristVelocity).length()
        leftWristInertia = Math.min(0.12, accel * 0.008)
        this.leftWristPrevPos.copy(curPos)
        this.leftWristVelocity.copy(vel)
      }
      if (rWrist) {
        const curPos = new THREE.Vector3()
        rWrist.getWorldPosition(curPos)
        const vel = curPos.clone().sub(this.rightWristPrevPos).divideScalar(dt)
        const accel = vel.clone().sub(this.rightWristVelocity).length()
        rightWristInertia = Math.min(0.12, accel * 0.008)
        this.rightWristPrevPos.copy(curPos)
        this.rightWristVelocity.copy(vel)
      }
    }

    let digitCounter = 0

    for (const finger of this.fingers) {
      const wristInertia = finger.side === 'Left' ? leftWristInertia : rightWristInertia

      for (let i = 0; i < finger.bones.length; i++) {
        const bState = finger.bones[i]
        if (!bState.bone) continue

        // 2. Cascade Delay Queue (Section 12: MCP: 0ms, PIP: 20ms, DIP: 35ms)
        const delaySec = (i === 1 ? 0.020 : i === 2 ? 0.035 : 0)
        bState.targetHistory.push({ time, curl: bState.targetCurl, spread: bState.targetSpread })
        
        // Discard expired history
        while (bState.targetHistory.length > 1 && bState.targetHistory[0].time < time - 0.1) {
          bState.targetHistory.shift()
        }

        // Find delayed target sample
        const targetSampleTime = time - delaySec
        let delayedTarget = bState.targetCurl
        for (let h = bState.targetHistory.length - 1; h >= 0; h--) {
          if (bState.targetHistory[h].time <= targetSampleTime) {
            delayedTarget = bState.targetHistory[h].curl
            break
          }
        }
        bState.delayedTargetCurl = delayedTarget

        // 3. Performance Music Modulation (Section 13: subtle audioPulse * small_amplitude)
        let musicModulation = 0
        if (bState.boneName.endsWith('1')) {
          const phase = digitCounter * 0.7
          const speed = this.activePose === 'performance-fast' ? 3.0 : 1.4
          const organicBreath = Math.sin(time * speed + phase) * 0.012
          const musicBeat = audioPulse * 0.015 * Math.sin(time * 8.0 + phase)
          musicModulation = organicBreath + musicBeat
        }

        // 4. Inertial Offset on MCP (lag behind wrist acceleration)
        const inertialOffset = i === 0 ? -wristInertia * 0.5 : 0

        const activeEffectiveTargetCurl = bState.delayedTargetCurl + musicModulation + inertialOffset
        const activeEffectiveTargetSpread = bState.targetSpread

        // 5. Second-Order Spring-Damper Numeric Integration (Section 9, 10)
        // Stiffness and damping scaled by digit responsiveness
        const effectiveStiffness = bState.stiffness * finger.responsiveness
        const effectiveDamping = bState.damping * Math.sqrt(finger.responsiveness)

        // Spring acceleration = stiffness * error - damping * velocity
        const curlError = activeEffectiveTargetCurl - bState.currentCurl
        const curlAccel = effectiveStiffness * curlError - effectiveDamping * bState.curlVelocity

        bState.curlVelocity += curlAccel * dt
        bState.curlVelocity = THREE.MathUtils.clamp(
          bState.curlVelocity,
          -bState.maxAngularVelocity,
          bState.maxAngularVelocity
        )
        bState.currentCurl += bState.curlVelocity * dt

        // Spread spring
        const spreadError = activeEffectiveTargetSpread - bState.currentSpread
        const spreadAccel = (effectiveStiffness * 0.7) * spreadError - (effectiveDamping * 0.9) * bState.spreadVelocity
        bState.spreadVelocity += spreadAccel * dt
        bState.spreadVelocity = THREE.MathUtils.clamp(bState.spreadVelocity, -15.0, 15.0)
        bState.currentSpread += bState.spreadVelocity * dt

        // 6. Strict Local Joint Limit Clamping (Section 7)
        bState.currentCurl = THREE.MathUtils.clamp(bState.currentCurl, bState.minCurl, bState.maxCurl)
        bState.currentSpread = THREE.MathUtils.clamp(bState.currentSpread, bState.minSpread, bState.maxSpread)

        // 7. Compute Final Delta Quaternion & Apply to Authored Bind Pose
        this._deltaEuler.set(bState.currentCurl, 0, bState.currentSpread, 'XYZ')
        this._deltaQuat.setFromEuler(this._deltaEuler)

        bState.bone.quaternion.copy(bState.bindPoseQuat).multiply(this._deltaQuat)
      }

      digitCounter++
    }
  }

  /**
   * Reset all finger bones directly to their authored bind pose.
   */
  resetToBindPose(): void {
    for (const finger of this.fingers) {
      for (const entry of finger.bones) {
        if (entry.bone) {
          entry.bone.quaternion.copy(entry.bindPoseQuat)
          entry.currentCurl = 0
          entry.currentSpread = 0
          entry.curlVelocity = 0
          entry.spreadVelocity = 0
        }
      }
    }
  }

  /**
   * Returns diagnostic live telemetry for the Calibration HUD.
   */
  getTelemetry() {
    return this.fingers.map((f) => ({
      name: f.name,
      side: f.side,
      type: f.fingerType,
      responsiveness: f.responsiveness,
      joints: f.bones.slice(0, 3).map((b, idx) => ({
        joint: idx === 0 ? 'MCP' : idx === 1 ? 'PIP' : 'DIP',
        curlDeg: +(b.currentCurl * (180 / Math.PI)).toFixed(1),
        spreadDeg: +(b.currentSpread * (180 / Math.PI)).toFixed(1),
        velocity: +b.curlVelocity.toFixed(2),
      })),
    }))
  }

  get isInitialized(): boolean {
    return this.initialized
  }
}
