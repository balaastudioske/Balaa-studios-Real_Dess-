/**
 * Flight Path System — CatmullRom Spline + Inertia
 *
 * Defines the Performance Mode camera/ship flight path as a smooth
 * CatmullRom spline rather than straight-line waypoints. Scroll
 * position maps to the t parameter (scroll = throttle).
 *
 * Motion uses acceleration/easing curves so movement feels like
 * it has mass — no constant linear speed.
 */

import * as THREE from 'three'

// ── Flight Path Definition ─────────────────────────────────────────

export interface FlightPathConfig {
  /** Control points for the CatmullRom spline */
  waypoints: THREE.Vector3[]
  /** Tension parameter (0 = Catmull-Rom default, 0.5 = tighter) */
  tension: number
  /** Whether the path loops */
  closed: boolean
}

/**
 * Default performance flight path — a gentle sweeping curve
 * through the space environment.
 */
export const DEFAULT_FLIGHT_PATH: FlightPathConfig = {
  waypoints: [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(5, 1, -20),
    new THREE.Vector3(-3, 2, -50),
    new THREE.Vector3(8, -1, -80),
    new THREE.Vector3(-5, 3, -120),
    new THREE.Vector3(0, 0, -160),
  ],
  tension: 0.3,
  closed: false,
}

/**
 * Creates a Three.js CatmullRomCurve3 from a flight path config.
 */
export function createFlightSpline(config: FlightPathConfig = DEFAULT_FLIGHT_PATH): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    config.waypoints,
    config.closed,
    'catmullrom',
    config.tension
  )
}

// ── Scroll-to-Progress Mapping ─────────────────────────────────────

export interface FlightState {
  /** Current position along the spline (0..1) */
  progress: number
  /** Current velocity (progress units per second) */
  velocity: number
  /** World position on the spline */
  position: THREE.Vector3
  /** Look-ahead tangent direction */
  tangent: THREE.Vector3
}

/**
 * Compute the flight state given scroll input.
 *
 * @param spline - The CatmullRom flight path
 * @param scrollInput - Raw scroll delta (positive = forward thrust)
 * @param currentState - Previous frame's flight state
 * @param delta - Frame delta time in seconds
 * @param config - Tuning parameters
 */
export function updateFlightState(
  spline: THREE.CatmullRomCurve3,
  scrollInput: number,
  currentState: FlightState,
  delta: number,
  config: {
    /** Max velocity in progress-units/sec */
    maxSpeed: number
    /** Acceleration rate when scroll input is applied */
    thrustAcceleration: number
    /** Deceleration rate when coasting (no input) */
    coastDrag: number
  } = {
    maxSpeed: 0.08,
    thrustAcceleration: 0.15,
    coastDrag: 0.92,
  }
): FlightState {
  let velocity = currentState.velocity

  if (Math.abs(scrollInput) > 0.001) {
    // Thrust applied — accelerate toward scroll direction
    const targetVelocity = Math.sign(scrollInput) * config.maxSpeed
    velocity += (targetVelocity - velocity) * config.thrustAcceleration * delta * 60
  } else {
    // Coasting — exponential drag
    velocity *= Math.pow(config.coastDrag, delta * 60)
  }

  // Clamp velocity
  velocity = THREE.MathUtils.clamp(velocity, -config.maxSpeed, config.maxSpeed)

  // Kill micro-velocities to avoid infinite drift
  if (Math.abs(velocity) < 0.0001) velocity = 0

  // Advance progress along spline
  let progress = currentState.progress + velocity * delta
  progress = THREE.MathUtils.clamp(progress, 0, 1)

  // Sample position and tangent from spline
  const position = spline.getPointAt(progress)
  const tangent = spline.getTangentAt(progress).normalize()

  return { progress, velocity, position, tangent }
}

/**
 * Creates the initial flight state at the start of the spline.
 */
export function createInitialFlightState(spline: THREE.CatmullRomCurve3): FlightState {
  return {
    progress: 0,
    velocity: 0,
    position: spline.getPointAt(0),
    tangent: spline.getTangentAt(0).normalize(),
  }
}
