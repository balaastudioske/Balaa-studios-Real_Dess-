/**
 * BALAA STUDIOS Merch Catalog
 *
 * Central registry for all merchandise items.
 * Products include both physical merch and digital items.
 */

export interface MerchProduct {
  id: string
  name: string
  description: string
  category: 'hoodie' | 'tshirt' | 'sweater' | 'jacket' | 'accessory' | 'digital'
  price: number
  currency: string
  /** Gradient for card display */
  gradient: string
  /** Avatar mesh/outfit preset ID (if wearable) */
  outfitPresetId?: string
  /** 3D garment file (if applicable) */
  garmentFile?: string
  /** Whether item is available */
  available: boolean
  /** Tags for filtering */
  tags: string[]
}

export const MERCH_CATALOG: MerchProduct[] = [
  // ─── Hoodies ────────────────────────────────────
  {
    id: 'balaa-hoodie-black',
    name: 'BALAA Classic Hoodie — Jet Black',
    description: 'Heavyweight brushed fleece. Oversized fit. Embroidered BALAA wordmark.',
    category: 'hoodie',
    price: 89,
    currency: 'USD',
    gradient: 'from-[#0A0A0A] to-[#2B2B2B]',
    outfitPresetId: 'hoodie_black',
    garmentFile: '/library/garments/hoodie.glb',
    available: true,
    tags: ['streetwear', 'essentials', 'unisex'],
  },
  {
    id: 'balaa-hoodie-charcoal',
    name: 'BALAA Classic Hoodie — Charcoal',
    description: 'Heavyweight brushed fleece. Oversized fit. Tonal BALAA logo.',
    category: 'hoodie',
    price: 89,
    currency: 'USD',
    gradient: 'from-[#2B2B2B] to-[#4a4a4a]',
    outfitPresetId: 'hoodie_charcoal',
    garmentFile: '/library/garments/hoodie.glb',
    available: true,
    tags: ['streetwear', 'essentials', 'unisex'],
  },

  // ─── T-Shirts ───────────────────────────────────
  {
    id: 'balaa-tee-white',
    name: 'BALAA Logo Tee — Pure White',
    description: 'Premium cotton. Relaxed cut. Centred BALAA mark in jet black.',
    category: 'tshirt',
    price: 45,
    currency: 'USD',
    gradient: 'from-white to-[#e5e5e5]',
    outfitPresetId: 'tee_white',
    garmentFile: '/library/garments/shirt.glb',
    available: true,
    tags: ['basics', 'unisex'],
  },
  {
    id: 'balaa-tee-black',
    name: 'BALAA Logo Tee — Jet Black',
    description: 'Premium cotton. Relaxed cut. Reverse BALAA mark in white.',
    category: 'tshirt',
    price: 45,
    currency: 'USD',
    gradient: 'from-[#0A0A0A] to-[#1a1a1a]',
    outfitPresetId: 'tee_black',
    garmentFile: '/library/garments/shirt.glb',
    available: true,
    tags: ['basics', 'unisex'],
  },

  // ─── Sweaters ───────────────────────────────────
  {
    id: 'balaa-sweater-charcoal',
    name: 'BALAA Crew Sweater — Charcoal',
    description: 'Mid-weight French terry. Crew neck. Embossed BALAA chest mark.',
    category: 'sweater',
    price: 75,
    currency: 'USD',
    gradient: 'from-[#2B2B2B] to-[#3d3d3d]',
    outfitPresetId: 'sweater_charcoal',
    garmentFile: '/library/garments/sweater.glb',
    available: true,
    tags: ['streetwear', 'layering'],
  },
  {
    id: 'balaa-sweater-cream',
    name: 'BALAA Crew Sweater — Cream',
    description: 'Mid-weight French terry. Crew neck. Black BALAA embroidery.',
    category: 'sweater',
    price: 75,
    currency: 'USD',
    gradient: 'from-[#f5f0e8] to-[#d4c9b8]',
    outfitPresetId: 'sweater_cream',
    garmentFile: '/library/garments/sweater.glb',
    available: true,
    tags: ['streetwear', 'layering'],
  },

  // ─── Jackets ────────────────────────────────────
  {
    id: 'balaa-bomber-black',
    name: 'BALAA Bomber Jacket',
    description: 'Nylon shell. Ribbed collar, cuffs and hem. Back BALAA print.',
    category: 'jacket',
    price: 149,
    currency: 'USD',
    gradient: 'from-[#0A0A0A] via-[#1a1a1a] to-[#0A0A0A]',
    available: true,
    tags: ['outerwear', 'limited'],
  },

  // ─── Accessories ────────────────────────────────
  {
    id: 'balaa-cap-black',
    name: 'BALAA Dad Cap',
    description: 'Washed cotton twill. Unstructured. Embroidered front mark.',
    category: 'accessory',
    price: 35,
    currency: 'USD',
    gradient: 'from-[#0A0A0A] to-[#2B2B2B]',
    available: true,
    tags: ['accessories', 'headwear'],
  },
  {
    id: 'balaa-tote',
    name: 'BALAA Canvas Tote',
    description: 'Heavy canvas. Screen-printed BALAA wordmark. Internal pocket.',
    category: 'accessory',
    price: 29,
    currency: 'USD',
    gradient: 'from-[#f5f0e8] to-[#d4c9b8]',
    available: true,
    tags: ['accessories', 'bags'],
  },

  // ─── Digital ────────────────────────────────────
  {
    id: 'balaa-avatar-skin',
    name: 'BALAA Digital Avatar Skin Pack',
    description: 'Exclusive outfit presets for your BALAA avatar. Includes all 10 looks.',
    category: 'digital',
    price: 15,
    currency: 'USD',
    gradient: 'from-fuchsia-600 to-pink-400',
    available: true,
    tags: ['digital', 'avatar', 'bundle'],
  },
]

export function getMerchById(id: string): MerchProduct | undefined {
  return MERCH_CATALOG.find((p) => p.id === id)
}

export function getMerchByCategory(category: MerchProduct['category']): MerchProduct[] {
  return MERCH_CATALOG.filter((p) => p.category === category)
}

export function getAvailableMerch(): MerchProduct[] {
  return MERCH_CATALOG.filter((p) => p.available)
}
