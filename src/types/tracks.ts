export type CameraPreset =
  | 'stage-full'
  | 'stage-wide'
  | 'front'
  | 'stage-left'
  | 'stage-right'
  | 'artist-medium'
  | 'close-up'
  | 'artist-close'
  | 'over-shoulder'
  | 'crowd'
  | 'audience'
  | 'free-orbit'
  | 'stage-3d'
  | 'top-view'

export type MoodPreset = 'blue-haze' | 'neon-club' | 'cyber-alley' | 'sunset'

export type AppMode = 'idle' | 'sequence' | 'performing' | 'scene-studio'

export type RenderMode =
  | 'balaa-hybrid'
  | 'pbr-only'
  | 'pbr-toon'
  | 'pbr-toon-outline'
  | 'pbr-toon-halftone'
  | 'npr-story'
  | 'npr-anime'
  | 'particles'

export type CameraMode = 'artist' | 'explore'

export interface SequenceStep {
  id: string
  animationClip: string
  cameraPreset?: CameraPreset
  durationMs: number
}

export interface AudioTrack {
  id: string
  title: string
  artist: string
  duration: number
  url?: string
  bpm: number
  coverArt: string
  mood: MoodPreset
  outfitPreset: string
  environmentPreset: string
  introSequence: SequenceStep[]
  performanceAnimation: string
}

export interface OutfitConfig {
  id: string
  name: string
  meshes: Record<string, boolean>
  colors: Record<string, string>
  meshOverrides?: Record<string, { visible?: boolean; color?: string }>
}