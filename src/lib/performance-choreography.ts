export interface SongMovementCue {
  id: string
  at: number
  position: [number, number, number]
  animationId: string
  /** Seconds reserved immediately before this mark for the walk-in. */
  travelDuration?: number
}

export interface RouteState {
  moving: boolean
  from: [number, number, number]
  to: [number, number, number]
  progress: number
  travelDuration: number
  cue: SongMovementCue
}

export interface CameraShot {
  id: string
  at: number
  duration: number
  position: [number, number, number]
  target: [number, number, number]
  fov: number
}

export interface SongPerformanceChoreography {
  trackId: string
  movement: SongMovementCue[]
  shots: CameraShot[]
}

const STORAGE_KEY = 'balaa_song_performance_choreography'

/**
 * The supplied performance references were authored at these musical tempi.
 * A song's detected/catalogue BPM is converted into an action time-scale so
 * its movement lands on the same beat grid as the audio.
 */
export const PERFORMANCE_CLIP_BPM = {
  hipHop: 100,
  drill: 140,
  danceBreak: 110,
  stageRoute: 120,
} as const

const MIN_TEMPO_OVERRIDE = 0.72
const MAX_TEMPO_OVERRIDE = 1.38

/**
 * Beat-synchronised animation override:
 *
 *   override = song BPM / authored animation BPM
 *
 * The clamp preserves readable footwork for unusually slow/fast tracks while
 * still keeping normal catalogue tracks exactly on their musical tempo.
 */
export const getTempoMatchedSpeed = (songBpm: number | undefined, authoredBpm: number): number => {
  const safeSongBpm = Number.isFinite(songBpm) && (songBpm ?? 0) > 0 ? songBpm! : authoredBpm
  return Math.min(MAX_TEMPO_OVERRIDE, Math.max(MIN_TEMPO_OVERRIDE, safeSongBpm / authoredBpm))
}

const clone = <T>(value: T): T => structuredClone(value)

const DEFAULT_MOVEMENT: SongMovementCue[] = [
  { id: 'centre', at: 0, position: [0, 0, 0], animationId: 'random-performance' },
  { id: 'left mark', at: 16, position: [-2.6, 0, 0.5], animationId: 'random-performance', travelDuration: 4 },
  { id: 'front mark', at: 32, position: [0, 0, -0.35], animationId: 'random-performance', travelDuration: 4 },
  { id: 'right mark', at: 48, position: [2.6, 0, 0.5], animationId: 'random-performance', travelDuration: 4 },
  { id: 'centre return', at: 60, position: [0, 0, 0], animationId: 'random-performance', travelDuration: 4 },
]

const DEFAULT_SHOTS: CameraShot[] = [
  { id: 'opening-wide', at: 0, duration: 1.1, position: [0, 1.8, 8.5], target: [0, 1.2, 0], fov: 44 },
  { id: 'left-wide', at: 6, duration: 1.0, position: [-5.5, 1.6, 3.5], target: [-1.5, 1.3, 0], fov: 42 },
  { id: 'right-wide', at: 12, duration: 1.0, position: [5.5, 1.6, 3.5], target: [1.5, 1.3, 0], fov: 42 },
  { id: 'front-low', at: 18, duration: 0.9, position: [0, 0.82, 4.6], target: [0, 1.15, 0], fov: 39 },
  { id: 'left-portrait', at: 24, duration: 0.8, position: [-2.8, 1.72, 2.7], target: [0, 1.48, 0], fov: 32 },
  { id: 'front-close', at: 30, duration: 0.75, position: [0, 1.55, 2.2], target: [0, 1.45, 0], fov: 34 },
  { id: 'right-portrait', at: 36, duration: 0.8, position: [2.8, 1.72, 2.7], target: [0, 1.48, 0], fov: 32 },
  { id: 'rear-three-quarter', at: 42, duration: 1.0, position: [-4.6, 2.3, -1.8], target: [0, 1.25, 0], fov: 46 },
  { id: 'hero-right', at: 48, duration: 1.0, position: [5.1, 2.05, 2.6], target: [0.8, 1.3, 0], fov: 40 },
  { id: 'final-wide', at: 56, duration: 1.15, position: [0, 2.35, 9.2], target: [0, 1.15, 0], fov: 47 },
]

export const createDefaultChoreography = (trackId: string): SongPerformanceChoreography => ({
  trackId,
  movement: clone(DEFAULT_MOVEMENT),
  shots: clone(DEFAULT_SHOTS),
})

const isFiniteTuple = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every((part) => typeof part === 'number' && Number.isFinite(part))

const isMovementCue = (value: unknown): value is SongMovementCue => {
  if (!value || typeof value !== 'object') return false
  const cue = value as Partial<SongMovementCue>
  return typeof cue.id === 'string' && typeof cue.at === 'number' && isFiniteTuple(cue.position) && typeof cue.animationId === 'string'
}

const isCameraShot = (value: unknown): value is CameraShot => {
  if (!value || typeof value !== 'object') return false
  const shot = value as Partial<CameraShot>
  return typeof shot.id === 'string' && typeof shot.at === 'number' && typeof shot.duration === 'number'
    && typeof shot.fov === 'number' && isFiniteTuple(shot.position) && isFiniteTuple(shot.target)
}

export const normalizeChoreography = (value: unknown, trackId: string): SongPerformanceChoreography => {
  const fallback = createDefaultChoreography(trackId)
  if (!value || typeof value !== 'object') return fallback
  const candidate = value as Partial<SongPerformanceChoreography>
  const movement = Array.isArray(candidate.movement) && candidate.movement.every(isMovementCue)
    ? candidate.movement.map((cue) => ({ ...cue, at: Math.max(0, cue.at) })).sort((a, b) => a.at - b.at)
    : fallback.movement
  const shots = Array.isArray(candidate.shots) && candidate.shots.every(isCameraShot)
    ? candidate.shots.map((shot) => ({ ...shot, at: Math.max(0, shot.at), duration: Math.max(0.05, shot.duration) })).sort((a, b) => a.at - b.at)
    : fallback.shots
  return { trackId, movement, shots }
}

export const loadSongChoreography = (trackId: string): SongPerformanceChoreography => {
  if (typeof window === 'undefined') return createDefaultChoreography(trackId)
  try {
    const all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, unknown>
    return normalizeChoreography(all[trackId], trackId)
  } catch {
    return createDefaultChoreography(trackId)
  }
}

export const saveSongChoreography = (choreography: SongPerformanceChoreography) => {
  if (typeof window === 'undefined') return
  let all: Record<string, unknown> = {}
  try {
    all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, unknown>
  } catch {
    // A corrupt older draft must not prevent the admin from saving a valid one.
  }
  all[choreography.trackId] = normalizeChoreography(choreography, choreography.trackId)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export const getCueAt = <T extends { at: number }>(cues: T[], seconds: number): T | null => {
  let active: T | null = null
  for (const cue of cues) {
    if (cue.at > seconds) break
    active = cue
  }
  return active
}

/** Determines whether the current route segment is a performance hold or a walk-in. */
export const getRouteState = (cues: SongMovementCue[], seconds: number): RouteState | null => {
  const cue = getCueAt(cues, seconds)
  if (!cue) return cues[0] ? { moving: false, from: cues[0].position, to: cues[0].position, progress: 1, travelDuration: 0, cue: cues[0] } : null
  const cueIndex = cues.findIndex((entry) => entry.id === cue.id)
  const next = cues[cueIndex + 1]
  if (!next) return { moving: false, from: cue.position, to: cue.position, progress: 1, travelDuration: 0, cue }
  const distance = Math.hypot(next.position[0] - cue.position[0], next.position[2] - cue.position[2])
  // A standard vocal walk is about 1.15m/s. Capping an overly long route
  // prevents in-place feet from visibly skating across the stage.
  const naturalWalkDuration = Math.max(0.8, distance / 1.15)
  const travelDuration = Math.min(Math.max(Math.min(next.travelDuration ?? naturalWalkDuration, naturalWalkDuration * 1.25), 0.5), Math.max(next.at - cue.at, 0.5))
  const travelStart = next.at - travelDuration
  if (seconds < travelStart) return { moving: false, from: cue.position, to: cue.position, progress: 1, travelDuration: 0, cue }
  return {
    moving: true,
    from: cue.position,
    to: next.position,
    progress: Math.min(1, Math.max(0, (seconds - travelStart) / travelDuration)),
    travelDuration,
    cue: next,
  }
}

export const getChoreographyDuration = (choreography: SongPerformanceChoreography): number => {
  const lastMovement = choreography.movement[choreography.movement.length - 1]
  return Math.max(1, lastMovement?.at ?? 60)
}
