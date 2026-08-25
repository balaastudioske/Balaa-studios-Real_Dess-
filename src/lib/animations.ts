// Maps animation clip names used in sequences to FBX file paths
// These animations are loaded via FBXLoader and retargeted to the avatar skeleton
export interface AnimationMapping {
  clipName: string
  fbxPath: string
  loop: boolean
  nprStepped?: boolean
  retarget?: 'direct' | 'bind-pose'
}

export const ANIMATION_MAPPINGS: Record<string, AnimationMapping> = {
  // Idle / standing animations
  idle_a: {
    clipName: 'Idle_A',
    fbxPath: '/library/animations/mixamo/Unarmed Idle Looking Ver. 2.fbx',
    loop: true,
  },
  happy_idle: {
    clipName: 'Happy_Idle',
    fbxPath: '/library/animations/mixamo/Happy Idle.fbx',
    loop: true,
  },
  sing: {
    clipName: 'Singing',
    fbxPath: '/library/animations/mixamo/Singing.fbx',
    loop: true,
  },
  plask_performance_1: {
    clipName: 'Plask_Performance_1',
    fbxPath: '/library/animations/plask/performance animation 1.fbx',
    loop: true,
    retarget: 'bind-pose',
  },

  // Movement
  walk_forward: {
    clipName: 'Walk_Forward',
    fbxPath: '/library/animations/mixamo/Standard Walk.fbx',
    loop: true,
  },
  walking: {
    clipName: 'Walking',
    fbxPath: '/library/animations/mixamo/Standard Walk.fbx',
    loop: true,
  },
  walking_1: {
    clipName: 'Walking_1',
    fbxPath: '/library/animations/mixamo/Standard Walk.fbx',
    loop: true,
  },
  walking_start: {
    clipName: 'Start_Walking',
    fbxPath: '/library/animations/mixamo/Start Walking.fbx',
    loop: false,
  },
  walking_backwards: {
    clipName: 'Walking_Backwards',
    fbxPath: '/library/animations/mixamo/Walking Backwards.fbx',
    loop: true,
  },
  walking_turn_180: {
    clipName: 'Walking_Turn_180',
    fbxPath: '/library/animations/mixamo/Walking Turn 180.fbx',
    loop: false,
  },
  jump: {
    clipName: 'Joyful_Jump',
    fbxPath: '/library/animations/mixamo/Joyful Jump.fbx',
    loop: false,
    nprStepped: true,
  },
  jump_down: {
    clipName: 'Jumping_Down',
    fbxPath: '/library/animations/mixamo/Jumping Down.fbx',
    loop: false,
    nprStepped: true,
  },

  // Dance / performance animations
  hip_hop_dancing: {
    clipName: 'Hip_Hop_Dancing',
    fbxPath: '/library/animations/mixamo/Hip Hop Dancing.fbx',
    loop: true,
    nprStepped: true,
  },
  hip_hop_dancing_1: {
    clipName: 'Hip_Hop_Dancing_1',
    fbxPath: '/library/animations/mixamo/Hip Hop Dancing (1).fbx',
    loop: true,
    nprStepped: true,
  },
  hip_hop_dancing_2: {
    clipName: 'Hip_Hop_Dancing_2',
    fbxPath: '/library/animations/mixamo/Hip Hop Dancing (2).fbx',
    loop: true,
    nprStepped: true,
  },
  robot_dance: {
    clipName: 'Robot_Hip_Hop_Dance',
    fbxPath: '/library/animations/mixamo/Robot Hip Hop Dance.fbx',
    loop: true,
    nprStepped: true,
  },
  bboy_move: {
    clipName: 'Bboy_Hip_Hop_Move',
    fbxPath: '/library/animations/mixamo/Bboy Hip Hop Move.fbx',
    loop: true,
    nprStepped: true,
  },

  // Gestural animations
  dismiss: {
    clipName: 'Dismissing_Gesture',
    fbxPath: '/library/animations/mixamo/Dismissing Gesture.fbx',
    loop: false,
  },
  plot: {
    clipName: 'Plotting',
    fbxPath: '/library/animations/mixamo/Plotting.fbx',
    loop: false,
  },
  point_forward: {
    clipName: 'Pointing_Forward',
    fbxPath: '/library/animations/mixamo/Pointing Forward.fbx',
    loop: false,
  },
  pray: {
    clipName: 'Praying',
    fbxPath: '/library/animations/mixamo/Praying.fbx',
    loop: false,
  },
  nervous_look: {
    clipName: 'Nervously_Look_Around',
    fbxPath: '/library/animations/mixamo/Nervously Look Around.fbx',
    loop: true,
  },
  shoved_spin: {
    clipName: 'Shoved_Reaction_With_Spin',
    fbxPath: '/library/animations/mixamo/Shoved Reaction With Spin.fbx',
    loop: false,
    nprStepped: true,
  },
  dodge_right: {
    clipName: 'Dodging_Right',
    fbxPath: '/library/animations/mixamo/Dodging Right.fbx',
    loop: false,
  },
  arm_stretch: {
    clipName: 'Arm_Stretching',
    fbxPath: '/library/animations/mixamo/Arm Stretching.fbx',
    loop: false,
  },
  pick_up: {
    clipName: 'Picking_Up',
    fbxPath: '/library/animations/mixamo/Picking Up.fbx',
    loop: false,
  },

  // Expressive animations
  angry: {
    clipName: 'Angry',
    fbxPath: '/library/animations/mixamo/Angry.fbx',
    loop: false,
  },
  offensive_idle: {
    clipName: 'Offensive_Idle',
    fbxPath: '/library/animations/mixamo/Offensive Idle.fbx',
    loop: true,
  },
  old_man_idle: {
    clipName: 'Old_Man_Idle',
    fbxPath: '/library/animations/mixamo/Old Man Idle.fbx',
    loop: true,
  },
  zombie_idle: {
    clipName: 'Zombie_Idle',
    fbxPath: '/library/animations/mixamo/Zombie Idle.fbx',
    loop: true,
  },
  zombie_idle_1: {
    clipName: 'Zombie_Idle_1',
    fbxPath: '/library/animations/mixamo/Zombie Idle (1).fbx',
    loop: true,
  },

  // Sitting
  sitting: {
    clipName: 'Sitting',
    fbxPath: '/library/animations/mixamo/Sitting.fbx',
    loop: true,
  },
  sitting_laugh: {
    clipName: 'Sitting_Laughing',
    fbxPath: '/library/animations/mixamo/Sitting Laughing.fbx',
    loop: true,
  },
  skinning_test: {
    clipName: 'Skinning_Test',
    fbxPath: '/library/animations/mixamo/Skinning Test.fbx',
    loop: true,
  },
  using_a_fax_machine: {
    clipName: 'Using_A_Fax_Machine',
    fbxPath: '/library/animations/mixamo/Using A Fax Machine.fbx',
    loop: true,
  },
}

/** Only these clips are allowed to move Dess through world space. Their root
 * translation is intentionally stripped; the stage director owns the route. */
export const LOCOMOTION_ANIMATION_IDS = ['walk_forward', 'walking', 'walking_1', 'walking_start', 'walking_backwards', 'walking_turn_180'] as const

/** Vocal/performance clips that can hold at a stage mark. No walking clip may
 * enter this pool, so random performance selection cannot create sliding. */
export const SINGING_ANIMATION_IDS = ['sing', 'idle_a', 'happy_idle', 'point_forward', 'dismiss', 'nervous_look', 'pray'] as const
export const DANCE_ANIMATION_IDS = ['hip_hop_dancing', 'hip_hop_dancing_1', 'hip_hop_dancing_2', 'robot_dance', 'bboy_move'] as const
export const STAGE_ROUTINE_ANIMATION_IDS = [...SINGING_ANIMATION_IDS, ...DANCE_ANIMATION_IDS] as const

// Preload all FBX animations for performance
export const preloadAnimations = () => {
  Object.values(ANIMATION_MAPPINGS).forEach((mapping) => {
    // FBXLoader doesn't have a preload, but we can reference the paths
    // for the preload list in the component
  })
}

export const getAnimationForSequenceStep = (sequenceStep: string): AnimationMapping | null => {
  const normalizedStep = sequenceStep.toLowerCase().replace(/_/g, '')

  for (const [key, mapping] of Object.entries(ANIMATION_MAPPINGS)) {
    const normalizedKey = key.toLowerCase().replace(/_/g, '')
    const normalizedClip = mapping.clipName.toLowerCase().replace(/_/g, '')

    if (normalizedKey === normalizedStep || normalizedClip === normalizedStep) {
      return mapping
    }
  }

  // Try direct clip name match
  for (const mapping of Object.values(ANIMATION_MAPPINGS)) {
    if (mapping.clipName === sequenceStep) {
      return mapping
    }
  }

  return null
}

export const getAnimationIdForSequenceStep = (sequenceStep: string): string | null => {
  const normalizedStep = sequenceStep.toLowerCase().replace(/_/g, '')

  for (const [key, mapping] of Object.entries(ANIMATION_MAPPINGS)) {
    const normalizedKey = key.toLowerCase().replace(/_/g, '')
    const normalizedClip = mapping.clipName.toLowerCase().replace(/_/g, '')

    if (normalizedKey === normalizedStep || normalizedClip === normalizedStep) {
      return key
    }
  }

  for (const [key, mapping] of Object.entries(ANIMATION_MAPPINGS)) {
    if (mapping.clipName === sequenceStep) {
      return key
    }
  }

  return null
}

