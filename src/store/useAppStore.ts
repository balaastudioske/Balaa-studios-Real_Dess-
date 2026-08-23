import { create } from 'zustand'
import { createDefaultChoreography, loadSongChoreography, type SongPerformanceChoreography } from '@/lib/performance-choreography'
import type {
  AudioTrack,
  MerchItem,
  CameraPreset,
  CameraMode,
  AppMode,
  RenderMode,
} from '@/types'

export interface CustomLightingConfig {
  keyLightColor: string
  keyLightIntensity: number
  ambientColor: string
  ambientIntensity: number
  neonColor: string
  neonIntensity: number
  fogColor: string
  fogDensity: number
}

interface AppState {
  currentTrack: AudioTrack | null
  isPlaying: boolean
  currentTime: number
  duration: number
  appMode: AppMode
  cameraMode: CameraMode
  renderMode: RenderMode
  sequenceStep: string | null
  currentMood: string | null
  currentOutfit: string | null
  currentEnvironment: string | null
  selectedMerch: MerchItem | null
  hoveredMesh: string | null
  audioPulse: number
  merchDrawerOpen: boolean
  activeCameraPreset: CameraPreset
  cameraTransitioning: boolean
  customLighting: CustomLightingConfig | null
  activeChoreography: SongPerformanceChoreography | null
  performanceStartedAt: number | null
  activeMediaId: string
  freeRoamTarget: [number, number, number] | null
  cameraResetNonce: number
}

interface AppActions {
  setTrack: (track: AudioTrack | null) => void
  setPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setAppMode: (mode: AppMode) => void
  setCameraMode: (mode: CameraMode) => void
  setRenderMode: (mode: RenderMode) => void
  setSequenceStep: (step: string | null) => void
  setMood: (mood: string | null) => void
  setOutfit: (outfit: string | null) => void
  setEnvironment: (env: string | null) => void
  setSelectedMerch: (item: MerchItem | null) => void
  setHoveredMesh: (name: string | null) => void
  setAudioPulse: (pulse: number) => void
  setMerchDrawerOpen: (open: boolean) => void
  setActiveCameraPreset: (preset: CameraPreset) => void
  setCameraTransitioning: (transitioning: boolean) => void
  setCustomLighting: (config: CustomLightingConfig | null) => void
  setActiveChoreography: (choreography: SongPerformanceChoreography | null) => void
  setPerformanceStartedAt: (timestamp: number | null) => void
  setActiveMediaId: (id: string) => void
  setFreeRoamTarget: (target: [number, number, number] | null) => void
  triggerCameraReset: () => void
  resetStore: () => void
}

export const useAppStore = create<AppState & AppActions>()((set) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  appMode: 'idle',
  cameraMode: 'artist',
  renderMode: 'balaa-hybrid',
  sequenceStep: null,
  currentMood: null,
  currentOutfit: 'look_01',
  currentEnvironment: null,
  selectedMerch: null,
  hoveredMesh: null,
  audioPulse: 0,
  merchDrawerOpen: false,
  activeCameraPreset: 'stage-full',
  cameraTransitioning: false,
  customLighting: null,
  activeChoreography: null,
  performanceStartedAt: null,
  activeMediaId: 'cure',
  freeRoamTarget: null,
  cameraResetNonce: 0,

  triggerCameraReset: () => set((state) => ({ cameraResetNonce: state.cameraResetNonce + 1 })),

  setTrack: (track) => set({ currentTrack: track }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  setAppMode: (mode) => set({ appMode: mode }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setRenderMode: (mode) => set({ renderMode: mode }),
  setSequenceStep: (step) => set({ sequenceStep: step }),
  setMood: (mood) => set({ currentMood: mood }),
  setOutfit: (outfit) => set({ currentOutfit: outfit }),
  setEnvironment: (env) => set({ currentEnvironment: env }),
  setSelectedMerch: (item) => set({ selectedMerch: item }),
  setHoveredMesh: (name) => set({ hoveredMesh: name }),
  setAudioPulse: (pulse) => set({ audioPulse: pulse }),
  setMerchDrawerOpen: (open) => set({ merchDrawerOpen: open }),
  setActiveCameraPreset: (preset) => set({ activeCameraPreset: preset }),
  setCameraTransitioning: (transitioning) => set({ cameraTransitioning: transitioning }),
  setCustomLighting: (config) => set({ customLighting: config }),
  setActiveChoreography: (choreography) => set({ activeChoreography: choreography }),
  setPerformanceStartedAt: (timestamp) => set({ performanceStartedAt: timestamp }),
  setActiveMediaId: (id) =>
    set({
      activeMediaId: id,
      isPlaying: true,
      appMode: 'performing',
      cameraMode: 'artist', // Keep artist mode active on track selection
      performanceStartedAt: Date.now(),
      activeChoreography: loadSongChoreography('shared-performance') || createDefaultChoreography(id),
      freeRoamTarget: null,
    }),
  setFreeRoamTarget: (target) => set({ freeRoamTarget: target }),
  resetStore: () =>
    set({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      appMode: 'idle',
      cameraMode: 'artist',
      renderMode: 'balaa-hybrid',
      sequenceStep: null,
      currentMood: null,
      currentOutfit: null,
      currentEnvironment: null,
      selectedMerch: null,
      hoveredMesh: null,
      merchDrawerOpen: false,
      activeCameraPreset: 'stage-full',
      customLighting: null,
      activeChoreography: null,
      performanceStartedAt: null,
      activeMediaId: 'cure',
      freeRoamTarget: null,
    }),
}))
