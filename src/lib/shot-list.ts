/**
 * Shot-List System — Admin-Authored Camera Presets
 *
 * Maps action types (dancing, singing, walking, etc.) to camera angle styles.
 * Admin (Mathina) configures these from the admin panel.
 * Hard rule: DESS must always remain the subject in frame — the camera
 * always targets DESS's current world position; the admin only picks
 * which angle/framing style applies to each action.
 *
 * Persisted to Firestore for cross-device reliability.
 */

import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
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

const FIRESTORE_DOC = 'config/shot-list'

/**
 * Load the shot-list from Firestore. Falls back to defaults if not found.
 */
export async function loadShotList(): Promise<ShotListRule[]> {
  try {
    const snap = await getDoc(doc(db, FIRESTORE_DOC))
    if (snap.exists()) {
      const data = snap.data()
      if (Array.isArray(data.rules) && data.rules.length > 0) {
        return data.rules as ShotListRule[]
      }
    }
  } catch (err) {
    console.warn('[ShotList] Firestore read failed, using defaults:', err)
  }
  return [...DEFAULT_SHOT_LIST]
}

/**
 * Save the shot-list to Firestore.
 */
export async function saveShotList(rules: ShotListRule[]): Promise<void> {
  try {
    await setDoc(doc(db, FIRESTORE_DOC), { rules, updatedAt: new Date().toISOString() })
  } catch (err) {
    console.error('[ShotList] Firestore write failed:', err)
    throw err
  }
}

/**
 * Given the current action type, look up the matching camera style.
 */
export function getCameraForAction(
  actionType: ActionType,
  rules: ShotListRule[] = DEFAULT_SHOT_LIST
): { cameraStyle: CameraPreset; transitionDuration: number } {
  const rule = rules.find((r) => r.actionType === actionType)
  return rule
    ? { cameraStyle: rule.cameraStyle, transitionDuration: rule.transitionDuration }
    : { cameraStyle: 'stage-full', transitionDuration: 1.0 }
}
