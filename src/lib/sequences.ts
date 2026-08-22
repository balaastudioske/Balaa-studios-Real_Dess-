import { MerchItem, AudioTrack, MoodPreset, OutfitConfig } from '@/types'

export type { MoodPreset }

export interface MoodPresetConfig {
  groundColor: string
  neonColor: string
  fogColor: string
  fogDensity: number
  keyLightColor: string
  keyLightEnergy: number
  ambientColor: string
  skyColor: string
}

export const MOOD_PRESETS: Record<MoodPreset, MoodPresetConfig> = {
  'blue-haze': {
    groundColor: '#17101d',
    neonColor: '#c026d3',
    fogColor: '#17101d',
    fogDensity: 0.05,
    keyLightColor: '#e879f9',
    keyLightEnergy: 1.0,
    ambientColor: '#29152e',
    skyColor: '#08060d',
  },
  'neon-club': {
    groundColor: '#100811',
    neonColor: '#d946ef',
    fogColor: '#100811',
    fogDensity: 0.08,
    keyLightColor: '#d946ef',
    keyLightEnergy: 1.5,
    ambientColor: '#321438',
    skyColor: '#1d0d21',
  },
  'cyber-alley': {
    groundColor: '#1b0a17',
    neonColor: '#f0abfc',
    fogColor: '#1b0a17',
    fogDensity: 0.1,
    keyLightColor: '#fb7185',
    keyLightEnergy: 0.8,
    ambientColor: '#3d173f',
    skyColor: '#160913',
  },
  'sunset': {
    groundColor: '#2a0c21',
    neonColor: '#fb7185',
    fogColor: '#2a0c21',
    fogDensity: 0.03,
    keyLightColor: '#f0abfc',
    keyLightEnergy: 0.9,
    ambientColor: '#5b204d',
    skyColor: '#260a1e',
  },
}

export const OUTFIT_PRESETS: Record<string, OutfitConfig> = {
  casual: {
    id: 'casual',
    name: 'Casual Fit',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: true },
    colors: { 'Top_02_Yaya_Combine': '#211225', Earing_01_mesh_Yaya: '#fbbf24' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#211225' }, Earing_01_mesh_Yaya: { visible: true, color: '#fbbf24' } },
  },
  stage: {
    id: 'stage',
    name: 'Stage Outfit',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: true },
    colors: { 'Top_02_Yaya_Combine': '#c026d3', Earing_01_mesh_Yaya: '#facc15' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#c026d3' }, Earing_01_mesh_Yaya: { visible: true, color: '#facc15' } },
  },
  neon: {
    id: 'neon',
    name: 'Neon Kit',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: true },
    colors: { 'Top_02_Yaya_Combine': '#d946ef', Earing_01_mesh_Yaya: '#e879f9' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#d946ef' }, Earing_01_mesh_Yaya: { visible: true, color: '#e879f9' } },
  },
  // ─── BALAA STUDIOS extended outfit presets ──────
  hoodie_black: {
    id: 'hoodie_black',
    name: 'BALAA Hoodie — Jet Black',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: true },
    colors: { 'Top_02_Yaya_Combine': '#0A0A0A', Earing_01_mesh_Yaya: '#c0c0c0' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#0A0A0A' }, Earing_01_mesh_Yaya: { visible: true, color: '#c0c0c0' } },
  },
  hoodie_charcoal: {
    id: 'hoodie_charcoal',
    name: 'BALAA Hoodie — Charcoal',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: true },
    colors: { 'Top_02_Yaya_Combine': '#2B2B2B', Earing_01_mesh_Yaya: '#fbbf24' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#2B2B2B' }, Earing_01_mesh_Yaya: { visible: true, color: '#fbbf24' } },
  },
  tee_white: {
    id: 'tee_white',
    name: 'BALAA Tee — White',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: false },
    colors: { 'Top_02_Yaya_Combine': '#FFFFFF' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#FFFFFF' }, Earing_01_mesh_Yaya: { visible: false } },
  },
  tee_black: {
    id: 'tee_black',
    name: 'BALAA Tee — Black',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: true },
    colors: { 'Top_02_Yaya_Combine': '#0A0A0A', Earing_01_mesh_Yaya: '#fbbf24' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#0A0A0A' }, Earing_01_mesh_Yaya: { visible: true, color: '#fbbf24' } },
  },
  sweater_charcoal: {
    id: 'sweater_charcoal',
    name: 'BALAA Sweater — Charcoal',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: true },
    colors: { 'Top_02_Yaya_Combine': '#2B2B2B', Earing_01_mesh_Yaya: '#e879f9' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#2B2B2B' }, Earing_01_mesh_Yaya: { visible: true, color: '#e879f9' } },
  },
  sweater_cream: {
    id: 'sweater_cream',
    name: 'BALAA Sweater — Cream',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: false },
    colors: { 'Top_02_Yaya_Combine': '#f5f0e8' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#f5f0e8' }, Earing_01_mesh_Yaya: { visible: false } },
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome Minimal',
    meshes: { 'Top_02_Yaya_Combine': true, Earing_01_mesh_Yaya: true },
    colors: { 'Top_02_Yaya_Combine': '#1a1a1a', Earing_01_mesh_Yaya: '#FFFFFF' },
    meshOverrides: { 'Top_02_Yaya_Combine': { visible: true, color: '#1a1a1a' }, Earing_01_mesh_Yaya: { visible: true, color: '#FFFFFF' } },
  },
}

export const getAllTracks = (): AudioTrack[] => {
  return [
    {
      id: 'cure',
      title: 'Cure',
      artist: 'BALAA STUDIOS',
      duration: 218,
      bpm: 120,
      coverArt: '/assets/images/merch/jacket_black.jpg',
      mood: 'blue-haze',
      outfitPreset: 'stage',
      environmentPreset: 'blue_haze',
      introSequence: [
        {
          id: 'intro_fade_in',
          animationClip: 'Idle_A',
          cameraPreset: 'stage-full',
          durationMs: 3000,
        },
        {
          id: 'intro_camera_move',
          animationClip: 'Idle_A',
          cameraPreset: 'close-up',
          durationMs: 5000,
        },
      ],
      performanceAnimation: 'hip_hop_dancing',
    },
    {
      id: 'master',
      title: 'Master',
      artist: 'BALAA STUDIOS',
      duration: 243,
      bpm: 126,
      coverArt: '/assets/images/merch/jacket_neon.jpg',
      mood: 'neon-club',
      outfitPreset: 'neon',
      environmentPreset: 'blue_haze',
      introSequence: [
        {
          id: 'intro_fade_in',
          animationClip: 'Idle_A',
          cameraPreset: 'stage-full',
          durationMs: 2500,
        },
        {
          id: 'intro_spin',
          animationClip: 'spin',
          cameraPreset: 'free-orbit',
          durationMs: 4000,
        },
      ],
      performanceAnimation: 'robot_dance',
    },
    {
      id: 'zainabu',
      title: 'Zainabu',
      artist: 'REAL_DESS Studio',
      duration: 189,
      bpm: 95,
      coverArt: 'https://via.placeholder.com/300x400/1e293b/94a3b8?text=Zainabu',
      mood: 'cyber-alley',
      outfitPreset: 'casual',
      environmentPreset: 'blue_haze',
      introSequence: [
        {
          id: 'intro_fade_in',
          animationClip: 'Idle_A',
          cameraPreset: 'stage-full',
          durationMs: 4000,
        },
        {
          id: 'intro_walk',
          animationClip: 'walk_forward',
          cameraPreset: 'close-up',
          durationMs: 5000,
        },
      ],
      performanceAnimation: 'bboy_move',
    },
  ]
}
