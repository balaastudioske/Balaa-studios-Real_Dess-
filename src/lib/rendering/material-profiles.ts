/**
 * BALAA STUDIOS — Material Rendering Profiles
 *
 * Defines material-specific balances between PBR realism and Toon/NPR stylization.
 * Each profile controls the lighting response, shadow floor, rim lighting,
 * and post-processing influence.
 */

export interface MaterialProfileConfig {
  name: string
  /** Balance between pure PBR (1.0) and full Toon (0.0) */
  pbrWeight: number
  /** Strength of the toon lighting quantization (0.0 = smooth PBR, 1.0 = full graphic bands) */
  toonStrength: number
  /** Minimum shadow multiplier — NEVER 0 to prevent crushing material albedo/texture to black */
  shadowFloor: number
  /** Midtone light band multiplier */
  midtoneLevel: number
  /** Highlight light band multiplier */
  highlightLevel: number
  /** Fresnel rim light intensity */
  rimStrength: number
  /** Outline weight in post-processing */
  outlineWeight: number
  /** Halftone dot intensity in shadows (0 = disabled, 1 = maximum) */
  halftoneWeight: number
}

export type MaterialProfileType = 'skin' | 'clothing' | 'stage' | 'props' | 'metal' | 'emissive' | 'default'

export const MATERIAL_PROFILES: Record<MaterialProfileType, MaterialProfileConfig> = {
  // DESS Skin: PBR 75% / Toon 25% — retains skin pores, subsurface tone, subtle graphic rim
  skin: {
    name: 'DESS Skin',
    pbrWeight: 0.75,
    toonStrength: 0.25,
    shadowFloor: 0.45,
    midtoneLevel: 0.80,
    highlightLevel: 1.05,
    rimStrength: 0.25,
    outlineWeight: 0.6,
    halftoneWeight: 0.12,
  },

  // Clothing / Garments: PBR 60% / Toon 40% — visible fabric weave with graphic anime shadow cuts
  clothing: {
    name: 'Garment / Fabric',
    pbrWeight: 0.60,
    toonStrength: 0.40,
    shadowFloor: 0.38,
    midtoneLevel: 0.75,
    highlightLevel: 1.10,
    rimStrength: 0.35,
    outlineWeight: 1.0,
    halftoneWeight: 0.22,
  },

  // Stage & Architecture: PBR 45% / Toon 55% — strong graphic shadows, detailed rubber/metal textures
  stage: {
    name: 'Stage Structure',
    pbrWeight: 0.45,
    toonStrength: 0.55,
    shadowFloor: 0.35,
    midtoneLevel: 0.70,
    highlightLevel: 1.15,
    rimStrength: 0.20,
    outlineWeight: 0.5,
    halftoneWeight: 0.18,
  },

  // Props & Set Dressing: PBR 50% / Toon 50%
  props: {
    name: 'Set Props',
    pbrWeight: 0.50,
    toonStrength: 0.50,
    shadowFloor: 0.36,
    midtoneLevel: 0.72,
    highlightLevel: 1.12,
    rimStrength: 0.30,
    outlineWeight: 0.8,
    halftoneWeight: 0.20,
  },

  // Metal & Jewelry: PBR 80% / Toon 20% — sharp specular highlights, preserved metallic reflections
  metal: {
    name: 'Metal & Jewelry',
    pbrWeight: 0.80,
    toonStrength: 0.20,
    shadowFloor: 0.40,
    midtoneLevel: 0.85,
    highlightLevel: 1.25,
    rimStrength: 0.45,
    outlineWeight: 0.7,
    halftoneWeight: 0.08,
  },

  // Emissive / Neon / Media Wall: 85% PBR/Emissive, 15% NPR bloom
  emissive: {
    name: 'Emissive & Neon',
    pbrWeight: 0.85,
    toonStrength: 0.15,
    shadowFloor: 0.80,
    midtoneLevel: 1.00,
    highlightLevel: 1.50,
    rimStrength: 0.10,
    outlineWeight: 0.2,
    halftoneWeight: 0.0,
  },

  // Default fallback
  default: {
    name: 'Standard Hybrid',
    pbrWeight: 0.65,
    toonStrength: 0.35,
    shadowFloor: 0.40,
    midtoneLevel: 0.75,
    highlightLevel: 1.08,
    rimStrength: 0.30,
    outlineWeight: 0.8,
    halftoneWeight: 0.15,
  },
}

/**
 * Detects the appropriate material profile for a given mesh or material name.
 */
export function detectMaterialProfile(meshName: string, materialName: string): MaterialProfileType {
  const combined = `${meshName.toLowerCase()} ${materialName.toLowerCase()}`

  if (combined.includes('skin') || combined.includes('head') || combined.includes('face') || combined.includes('body') || combined.includes('dess')) {
    return 'skin'
  }
  if (combined.includes('hoodie') || combined.includes('shirt') || combined.includes('pant') || combined.includes('shorts') || combined.includes('fabric') || combined.includes('cloth') || combined.includes('shoe') || combined.includes('sock') || combined.includes('cap')) {
    return 'clothing'
  }
  if (combined.includes('metal') || combined.includes('gold') || combined.includes('silver') || combined.includes('chrome') || combined.includes('chain')) {
    return 'metal'
  }
  if (combined.includes('emissive') || combined.includes('neon') || combined.includes('light') || combined.includes('screen') || combined.includes('media_wall') || combined.includes('glow')) {
    return 'emissive'
  }
  if (combined.includes('stage') || combined.includes('deck') || combined.includes('floor') || combined.includes('truss') || combined.includes('pillar') || combined.includes('physical_set')) {
    return 'stage'
  }
  if (combined.includes('prop') || combined.includes('chair') || combined.includes('couch') || combined.includes('mic') || combined.includes('counter')) {
    return 'props'
  }

  return 'default'
}
