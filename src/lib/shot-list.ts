/**
 * Shot-List System — Admin-Authored Camera Presets
 *
 * Maps action types (dancing, singing, walking, etc.) to camera angle styles.
 * Hard rule: DESS must always remain the subject in frame — the camera
 * always targets DESS's current world position.
 */

import type { CameraPreset } from '@/types'

export type ActionType = 'dancing' | 'singing' | 'walking' | 'idle' | 'expression'

export interface ShotListRule {
  id: string
  label: string
  actionType: ActionType
  cameraStyle: CameraPreset
  transitionDuration: number
}

export const DEFAULT_SHOT_LIST: ShotListRule[] = [
  {
    id: 'dance-wide',
    label: 'Dancing → Wide Tracking',
    actionType: 'dancing',
    cameraStyle: 'stage-wide',
    transitionDuration: 1.2,
  },
  {
    id: 'sing-close',
    label: 'Singing → Close-Up',
    actionType: 'singing',
    cameraStyle: 'close-up',
    transitionDuration: 0.8,
  },
  {
    id: 'walk-medium',
    label: 'Walking → Medium',
    actionType: 'walking',
    cameraStyle: 'artist-medium',
    transitionDuration: 1.0,
  },
  {
    id: 'idle-full',
    label: 'Idle → Stage Full',
    actionType: 'idle',
    cameraStyle: 'stage-full',
    transitionDuration: 1.0,
  },
  {
    id: 'expr-bust',
    label: 'Expression → Bust Shot',
    actionType: 'expression',
    cameraStyle: 'artist-close',
    transitionDuration: 0.6,
  },
]

let activeShotRules: ShotListRule[] = [...DEFAULT_SHOT_LIST]

/**
 * Load the shot-list.
 */
export async function loadShotList(): Promise<ShotListRule[]> {
  return [...activeShotRules]
}

/**
 * Save the shot-list.
 */
export async function saveShotList(rules: ShotListRule[]): Promise<void> {
  activeShotRules = [...rules]
}

/**
 * Given the current action type, look up the matching camera style.
 */
export function getCameraForAction(
  actionType: ActionType,
  rules: ShotListRule[] = activeShotRules
): { cameraStyle: CameraPreset; transitionDuration: number } {
  const rule = rules.find((r) => r.actionType === actionType)
  return rule
    ? { cameraStyle: rule.cameraStyle, transitionDuration: rule.transitionDuration }
    : { cameraStyle: 'stage-full', transitionDuration: 1.0 }
}
