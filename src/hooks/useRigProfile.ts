'use client'

import { useEffect, useState } from 'react'
import type { RigProfile, BoneScaleGroup } from '@/types/rig'
import { DEFAULT_BONE_GROUPS, DEFAULT_HAIR_PHYSICS } from '@/types/rig'

/**
 * Loads the active RigProfile from localStorage (later: Firestore).
 * Returns the bone groups map so consumers can apply scales per-frame.
 */
export function useRigProfile() {
  const [boneGroups, setBoneGroups] = useState<Record<string, BoneScaleGroup>>(DEFAULT_BONE_GROUPS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dess_rig_profile')
      if (stored) {
        const profile: RigProfile = JSON.parse(stored)
        if (profile.boneGroups) setBoneGroups(profile.boneGroups)
      }
    } catch {
      // Corrupt data — fall back to defaults
    }
  }, [])

  return { boneGroups }
}
