/**
 * Scene Studio — Prop Library
 *
 * Type definitions and discovery for the prop asset library.
 * Props are GLB files stored in public/library/props/ organized by category.
 */

export interface PropAsset {
  id: string
  name: string
  category: string
  /** Path relative to public/ */
  glbPath: string
  /** Optional thumbnail image */
  thumbnail?: string
}

export type PropCategory = 'kitchen' | 'furniture' | 'outdoor' | 'custom'

export const PROP_CATEGORIES: { id: PropCategory; label: string }[] = [
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'custom', label: 'Custom Uploads' },
]

/**
 * Placeholder prop catalog. In production, this would be dynamically
 * populated by scanning the public/library/props/ directory or
 * fetched from an API endpoint.
 */
export const PROP_CATALOG: PropAsset[] = [
  // Catalog starts empty — admin uploads GLBs to populate
]

/**
 * Get props filtered by category.
 */
export function getPropsByCategory(category: PropCategory): PropAsset[] {
  return PROP_CATALOG.filter((p) => p.category === category)
}
