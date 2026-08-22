/**
 * A RigProfile stores bone-scale overrides and hair-physics parameters
 * authored inside the Admin Studio Rig Tuner.  The Public Hub loads the
 * active profile and applies it to the avatar at mount time.
 */
export interface BoneScaleGroup {
  label: string
  bones: string[]         // bone names in the skeleton
  scale: [number, number, number]  // x, y, z scale multipliers
}

export interface HairPhysics {
  stiffness: number       // 0–1
  damping: number         // 0–1
  gravityInfluence: number // 0–1
  settleTime: number      // seconds
}

export interface RigProfile {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  active: boolean
  boneGroups: Record<string, BoneScaleGroup>
  hairPhysics: HairPhysics
}

/** Default bone groups matching the DESS avatar skeleton. */
export const DEFAULT_BONE_GROUPS: Record<string, BoneScaleGroup> = {
  head: {
    label: 'Head / Neck',
    bones: ['Head', 'Neck'],
    scale: [1, 1, 1],
  },
  spine: {
    label: 'Spine',
    bones: ['Spine', 'Spine1', 'Spine2'],
    scale: [1, 1, 1],
  },
  shoulders: {
    label: 'Shoulders',
    bones: ['LeftShoulder', 'RightShoulder'],
    scale: [1, 1, 1],
  },
  arms: {
    label: 'Upper Arms',
    bones: ['LeftArm', 'RightArm'],
    scale: [1, 1, 1],
  },
  forearms: {
    label: 'Forearms',
    bones: ['LeftForeArm', 'RightForeArm'],
    scale: [1, 1, 1],
  },
  hands: {
    label: 'Hands',
    bones: ['LeftHand', 'RightHand'],
    scale: [1, 1, 1],
  },
  hips: {
    label: 'Hips',
    bones: ['Hips'],
    scale: [1, 1, 1],
  },
  legs: {
    label: 'Upper Legs',
    bones: ['LeftUpLeg', 'RightUpLeg'],
    scale: [1, 1, 1],
  },
  shins: {
    label: 'Lower Legs',
    bones: ['LeftLeg', 'RightLeg'],
    scale: [1, 1, 1],
  },
  feet: {
    label: 'Feet',
    bones: ['LeftFoot', 'RightFoot'],
    scale: [1, 1, 1],
  },
}

export const DEFAULT_HAIR_PHYSICS: HairPhysics = {
  stiffness: 0.6,
  damping: 0.4,
  gravityInfluence: 0.3,
  settleTime: 0.8,
}

export const createDefaultRigProfile = (): Omit<RigProfile, 'id'> => ({
  name: 'Default DESS Rig',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  active: true,
  boneGroups: structuredClone(DEFAULT_BONE_GROUPS),
  hairPhysics: { ...DEFAULT_HAIR_PHYSICS },
})
