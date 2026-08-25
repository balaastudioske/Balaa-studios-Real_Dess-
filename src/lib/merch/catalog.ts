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
  {
    id: 'balaa-black-hoodie',
    name: 'Balaa Black Hoodie',
    description: 'Heavyweight brushed fleece. Oversized fit. Embroidered BALAA wordmark.',
    category: 'hoodie',
    price: 1780,
    currency: 'KSH',
    gradient: 'from-[#0A0A0A] to-[#2B2B2B]',
    outfitPresetId: 'hoodie_black',
    garmentFile: '/library/merch/01/garment.glb',
    available: true,
    tags: ['streetwear', 'essentials', 'unisex'],
  },
  {
    id: 'balaa-black-tee',
    name: 'Balaa Black T-EE',
    description: 'Premium cotton. Relaxed cut. Bold BALAA studio branding.',
    category: 'tshirt',
    price: 900,
    currency: 'KSH',
    gradient: 'from-[#0A0A0A] to-[#1a1a1a]',
    outfitPresetId: 'tee_black',
    garmentFile: '/library/merch/02/garment.glb',
    available: true,
    tags: ['basics', 'unisex'],
  },
  {
    id: 'balaa-bw-sweatshirt',
    name: 'Balaa Black and White Sweatshirt',
    description: 'Mid-weight French terry dual-tone crewneck knit.',
    category: 'sweater',
    price: 1500,
    currency: 'KSH',
    gradient: 'from-[#2B2B2B] to-[#3d3d3d]',
    outfitPresetId: 'sweater_charcoal',
    garmentFile: '/library/merch/03/garment.glb',
    available: true,
    tags: ['streetwear', 'layering'],
  },
  {
    id: 'balaa-bw-hoodie',
    name: 'Balaa Black and White Hoodie',
    description: 'Dual tone contrast heavyweight fleece hoodie.',
    category: 'hoodie',
    price: 1780,
    currency: 'KSH',
    gradient: 'from-[#2B2B2B] to-[#4a4a4a]',
    outfitPresetId: 'hoodie_charcoal',
    garmentFile: '/library/merch/04/garment.glb',
    available: true,
    tags: ['streetwear', 'essentials', 'unisex'],
  },
  {
    id: 'balaa-sweatshirt',
    name: 'Balaa Sweatshirt',
    description: 'Ultra plush French terry crewneck with embossed chest mark.',
    category: 'sweater',
    price: 1500,
    currency: 'KSH',
    gradient: 'from-[#1a1a1a] to-[#2e2e2e]',
    outfitPresetId: 'sweater_charcoal',
    garmentFile: '/library/merch/05/garment.glb',
    available: true,
    tags: ['streetwear', 'layering'],
  },
  {
    id: 'balaa-white-left-logo-hoodie',
    name: 'Balaa White Left Chest Logo Hoodie',
    description: 'Pure white concert hoodie with left-chest logo mark.',
    category: 'hoodie',
    price: 1780,
    currency: 'KSH',
    gradient: 'from-white to-[#e5e5e5]',
    outfitPresetId: 'hoodie_white',
    garmentFile: '/library/merch/06/garment.glb',
    available: true,
    tags: ['streetwear', 'essentials'],
  },
  {
    id: 'balaa-white-sweater',
    name: 'Balaa White Sweater',
    description: 'Mid-weight French terry crew neck in crisp white.',
    category: 'sweater',
    price: 1500,
    currency: 'KSH',
    gradient: 'from-[#f5f0e8] to-[#d4c9b8]',
    outfitPresetId: 'sweater_cream',
    garmentFile: '/library/merch/07/garment.glb',
    available: true,
    tags: ['streetwear', 'layering'],
  },
  {
    id: 'balaa-white-tee',
    name: 'Balaa White T-EE',
    description: 'Premium cotton. Relaxed cut. Centred BALAA mark in jet black.',
    category: 'tshirt',
    price: 900,
    currency: 'KSH',
    gradient: 'from-white to-[#e5e5e5]',
    outfitPresetId: 'tee_white',
    garmentFile: '/library/merch/08/garment.glb',
    available: true,
    tags: ['basics', 'unisex'],
  },
  {
    id: 'balaa-white-hoodie',
    name: 'Balaa White Hoodie',
    description: 'Pure white concert hoodie with high-density BALAA crest.',
    category: 'hoodie',
    price: 1780,
    currency: 'KSH',
    gradient: 'from-white to-[#dcdcdc]',
    outfitPresetId: 'hoodie_white',
    garmentFile: '/library/merch/09/garment.glb',
    available: true,
    tags: ['streetwear', 'essentials'],
  },
  {
    id: 'balaa-black-left-logo-hoodie',
    name: 'Balaa Black Left Chest Logo Hoodie',
    description: 'Signature black hoodie with subtle left chest logo emblem.',
    category: 'hoodie',
    price: 1780,
    currency: 'KSH',
    gradient: 'from-[#0A0A0A] via-[#1a1a1a] to-[#0A0A0A]',
    outfitPresetId: 'hoodie_black',
    garmentFile: '/library/merch/10/garment.glb',
    available: true,
    tags: ['streetwear', 'limited'],
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
