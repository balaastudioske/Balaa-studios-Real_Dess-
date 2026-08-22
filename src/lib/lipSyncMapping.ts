export interface MouthCue {
  start: number
  end: number
  value: string // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'X'
}

export interface LipSyncData {
  metadata: {
    soundFile: string
    duration: number
  }
  mouthCues: MouthCue[]
}

// Maps Rhubarb mouth cues (A to G, plus X for silence) to ARKit 3D face blendshapes.
// Each cue target value is a key-value map of blendshape names to their target weights (0.0 to 1.0).
export const RHUBARB_TO_ARKIT: Record<string, Record<string, number>> = {
  A: {
    jawOpen: 0.0,
    mouthClose: 0.0,
    mouthPucker: 0.0,
    mouthFunnel: 0.0,
    mouthRollLower: 0.0,
    mouthRollUpper: 0.0,
  },
  B: {
    jawOpen: 0.12,
    mouthClose: 0.0,
    mouthPucker: 0.0,
    mouthFunnel: 0.0,
    mouthRollLower: 0.0,
    mouthRollUpper: 0.0,
  },
  C: {
    jawOpen: 0.28,
    mouthClose: 0.0,
    mouthPucker: 0.08,
    mouthFunnel: 0.0,
    mouthRollLower: 0.0,
    mouthRollUpper: 0.0,
  },
  D: {
    jawOpen: 0.65,
    mouthClose: 0.0,
    mouthPucker: 0.0,
    mouthFunnel: 0.0,
    mouthRollLower: 0.0,
    mouthRollUpper: 0.0,
  },
  E: {
    jawOpen: 0.22,
    mouthClose: 0.0,
    mouthPucker: 0.2,
    mouthFunnel: 0.35,
    mouthRollLower: 0.0,
    mouthRollUpper: 0.0,
  },
  F: {
    jawOpen: 0.15,
    mouthClose: 0.0,
    mouthPucker: 0.65,
    mouthFunnel: 0.5,
    mouthRollLower: 0.0,
    mouthRollUpper: 0.0,
  },
  G: {
    jawOpen: 0.04,
    mouthClose: 0.2,
    mouthPucker: 0.0,
    mouthFunnel: 0.0,
    mouthRollLower: 0.22,
    mouthRollUpper: 0.0,
  },
  X: {
    jawOpen: 0.0,
    mouthClose: 0.0,
    mouthPucker: 0.0,
    mouthFunnel: 0.0,
    mouthRollLower: 0.0,
    mouthRollUpper: 0.0,
  },
}
