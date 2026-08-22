import { CameraPreset } from '@/types'

export const CAMERA_PRESETS: Record<
  CameraPreset,
  {
    position: [number, number, number]
    lookAt: [number, number, number]
    fov: number
    duration: number
    label: string
  }
> = {
  'stage-full': {
    position: [0, 1.8, 8.5],
    lookAt: [0, 1.2, 0],
    fov: 44,
    duration: 1.0,
    label: 'Stage Full',
  },
  'stage-wide': {
    position: [0, 2.2, 11.0],
    lookAt: [0, 1.2, 0],
    fov: 50,
    duration: 1.2,
    label: 'Stage Wide',
  },
  front: {
    position: [0, 1.5, 4.0],
    lookAt: [0, 1.4, 0],
    fov: 40,
    duration: 0.8,
    label: 'Front Performer',
  },
  'stage-left': {
    position: [-5.5, 1.6, 3.5],
    lookAt: [0, 1.35, 0],
    fov: 42,
    duration: 1.0,
    label: 'Stage Left',
  },
  'stage-right': {
    position: [5.5, 1.6, 3.5],
    lookAt: [0, 1.35, 0],
    fov: 42,
    duration: 1.0,
    label: 'Stage Right',
  },
  'artist-medium': {
    position: [0, 1.5, 3.2],
    lookAt: [0, 1.35, 0],
    fov: 38,
    duration: 0.8,
    label: 'Artist Medium',
  },
  'close-up': {
    position: [0, 1.55, 1.8],
    lookAt: [0, 1.5, 0],
    fov: 32,
    duration: 0.6,
    label: 'Close-Up',
  },
  'artist-close': {
    position: [0, 1.55, 1.8],
    lookAt: [0, 1.5, 0],
    fov: 32,
    duration: 0.6,
    label: 'Artist Close',
  },
  'over-shoulder': {
    position: [0.8, 1.7, -1.2],
    lookAt: [0, 1.4, 4.0],
    fov: 45,
    duration: 1.0,
    label: 'Over Shoulder',
  },
  crowd: {
    position: [0, 1.0, 12.0],
    lookAt: [0, 1.8, 0],
    fov: 55,
    duration: 1.2,
    label: 'Audience Pit',
  },
  audience: {
    position: [0, 1.0, 12.0],
    lookAt: [0, 1.8, 0],
    fov: 55,
    duration: 1.2,
    label: 'Audience Pit',
  },
  'stage-3d': {
    position: [9.5, 5.5, 9.5],
    lookAt: [0, 1.5, 0],
    fov: 46,
    duration: 1.2,
    label: 'Isometric 3D',
  },
  'top-view': {
    position: [0, 14.0, 0.1],
    lookAt: [0, 0, 0],
    fov: 50,
    duration: 1.2,
    label: 'Top Down',
  },
  'free-orbit': {
    position: [0, 1.8, 8.5],
    lookAt: [0, 1.2, 0],
    fov: 44,
    duration: 1.0,
    label: 'Free Orbit',
  },
}

export const getCameraPreset = (preset: CameraPreset) => CAMERA_PRESETS[preset] || CAMERA_PRESETS['stage-full']