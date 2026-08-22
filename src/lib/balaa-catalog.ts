export type BalaaStageMode = 'catalog' | 'wardrobe' | 'licensing' | 'services' | 'support'

export interface MediaCatalogItem {
  id: string
  title: string
  youtubeUrl: string
  youtubeVideoId: string
  type: 'music-video' | 'visualizer' | 'lyric-video' | 'studio-session' | 'freestyle'
  category: 'music'
}

/** Direct Song Master Licensing tiers with dual KSh (KES) and USD ($) pricing */
export interface MasterLicense {
  id: string
  name: string
  priceKsh: number
  priceUsd: number
  unit: string
  description: string
  rights: string[]
  recommended?: boolean
  popular?: boolean
}

/** Legacy type alias for compatibility */
export type LicenseTier = MasterLicense

export const REAL_DESS_MASTER_LICENSES: MasterLicense[] = [
  {
    id: 'kiosk',
    name: 'Kiosk / Small Business',
    priceKsh: 100,
    priceUsd: 1,
    unit: 'per song',
    description: 'Play this REAL_DESS song in your shop, salon, boutique, barbershop, or cafe.',
    rights: [
      'Public background playback in your physical venue',
      'Lossless 24-bit studio master audio download',
      'Official artist authorization certificate',
      'Direct contribution to independent Kenyan artistry',
    ],
    popular: true,
  },
  {
    id: 'creator',
    name: 'Creator / Social Media',
    priceKsh: 300,
    priceUsd: 3,
    unit: 'per song',
    description: 'Use this REAL_DESS song in your social content across TikTok, Instagram Reels, and YouTube Shorts.',
    rights: [
      'Worldwide social video monetization rights',
      'Up to 250,000 video views / streams coverage',
      'Lossless 24-bit master WAV audio track',
      'Automatic YouTube Content ID whitelist',
    ],
    recommended: true,
  },
  {
    id: 'business',
    name: 'Business / Events / DJ',
    priceKsh: 1000,
    priceUsd: 10,
    unit: 'per song',
    description: 'Use in business presentations, corporate videos, live events, DJ festival sets, parties, and fashion shows.',
    rights: [
      'Corporate video, app, podcast, and event sync rights',
      'Live venue sound system and DJ set performance playback',
      'Lossless 24-bit master recording WAV file',
      'Commercial clearance and event marketing coverage',
    ],
  },
  {
    id: 'commercial',
    name: 'Commercial & Advertising',
    priceKsh: 2500,
    priceUsd: 25,
    unit: 'per campaign',
    description: 'Use in paid digital ads, brand campaigns, promotional cinema reels, and commercial video releases.',
    rights: [
      'Paid social media and digital web advertising clearance',
      'Full instrumental and vocal master files',
      'Perpetual digital advertising master license',
      'Commercial brand sync authorization',
    ],
  },
  {
    id: 'premium',
    name: 'Premium / Broadcast / Film',
    priceKsh: 10000,
    priceUsd: 100,
    unit: 'per production',
    description: 'National TV broadcast, feature film sync, global OTT streaming, major brand campaigns, and exclusive licensing.',
    rights: [
      'Worldwide theatrical, television, and global streaming synchronization',
      'Unlimited commercial distribution and reproduction rights',
      'Complete multi-track stem archive & master cue-sheet data',
      'Dedicated Real Des management coordination',
    ],
  },
]

/** Legacy alias */
export const REAL_DESS_LICENSE_TIERS = REAL_DESS_MASTER_LICENSES

export const REAL_DESS_MASTER_LICENSE_PRICES = {
  kiosk: 1,
  creator: 3,
  business: 10,
  commercial: 25,
  premium: 100,
} as const

/** Legacy alias */
export const REAL_DESS_LICENSE_PRICES = REAL_DESS_MASTER_LICENSE_PRICES
export type RealDessLicenseTier = keyof typeof REAL_DESS_MASTER_LICENSE_PRICES

/** Authoritative Creative Production & Hire Services from RealDess Vault */
export interface CreativeService {
  id: string
  name: string
  priceKsh: number
  priceUsd: number
  unit: string
  description: string
  deliverables: string[]
  startingPrice?: boolean
}

export const REAL_DESS_SERVICES: CreativeService[] = [
  {
    id: 'performing',
    name: 'Live Performance',
    priceKsh: 7000,
    priceUsd: 70,
    unit: 'From KSh 7,000',
    description: 'Curated high-energy live stage performance, headline club sets, and festival appearances by Real Des.',
    deliverables: ['Live performance vocal set', 'Custom concert intro & DJ playback bundle', 'Direct artist soundcheck & rider coordination'],
    startingPrice: true,
  },
  {
    id: 'appearance',
    name: 'Artist Appearance & Host',
    priceKsh: 2000,
    priceUsd: 20,
    unit: 'From KSh 2,000',
    description: 'VIP artist guest appearance, brand event walkthrough, red carpet, and meet & greet hosting.',
    deliverables: ['Event guest attendance & photo op', 'Social media story shoutout', 'Exclusive VIP activation presence'],
    startingPrice: true,
  },
  {
    id: 'recording',
    name: 'Studio & Vocal Sessions',
    priceKsh: 6500,
    priceUsd: 65,
    unit: 'From KSh 6,500',
    description: 'Professional in-studio vocal tracking, lead/backing harmonization, and master demo capture.',
    deliverables: ['Studio vocal tracking session', 'Tuned vocal stems (24-bit WAV)', 'Raw + processed take archive'],
    startingPrice: true,
  },
  {
    id: 'video-production',
    name: 'Video Editing & Colour Grade',
    priceKsh: 5000,
    priceUsd: 50,
    unit: 'From KSh 5,000',
    description: 'Complete post-production pipeline including story editing, filmic color grading, stylized FX, and final delivery.',
    deliverables: ['Full video final edit', 'Film emulation color grading', '16:9 master + 9:16 social cutdowns'],
    startingPrice: true,
  },
  {
    id: 'video-shooting',
    name: 'Music Video Production',
    priceKsh: 25000,
    priceUsd: 250,
    unit: 'From KSh 25,000',
    description: 'On-location music video cinematography, performance capture, lighting and director of photography.',
    deliverables: ['Cinema multi-cam shoot', 'Directorial performance guidance', 'Raw footage rushes transfer'],
    startingPrice: true,
  },
  {
    id: 'content-creation',
    name: 'Short-Form Content & Reels',
    priceKsh: 5000,
    priceUsd: 50,
    unit: 'From KSh 5,000',
    description: 'High-impact short-form videos, teasers, behind-the-scenes reels, and launch assets tailored for TikTok & IG.',
    deliverables: ['Edited vertical video reels', 'Motion typography & custom sound design', 'Optimized release schedule strategy'],
    startingPrice: true,
  },
  {
    id: 'creative-direction',
    name: 'Creative Direction & Identity',
    priceKsh: 5000,
    priceUsd: 50,
    unit: 'From KSh 5,000',
    description: 'Cohesive visual identity, album art concept, stage styling, typography, and 3D virtual world aesthetics.',
    deliverables: ['Complete artist brand styleguide', 'Cover artwork design direction', 'Stage visualizer & set aesthetic deck'],
    startingPrice: true,
  },
  {
    id: 'songwriting',
    name: 'Songwriting & Toplines',
    priceKsh: 5000,
    priceUsd: 50,
    unit: 'From KSh 5,000',
    description: 'Hit-ready melody creation, hook composition, lyrical architecture, and arrangement collaboration.',
    deliverables: ['Full vocal melody guide demo', 'Lyric sheet & timing guide', 'Commercial publishing clearance'],
    startingPrice: true,
  },
  {
    id: 'licensing',
    name: 'Song Master Licensing',
    priceKsh: 100,
    priceUsd: 1,
    unit: 'From KSh 100',
    description: 'Direct master sound recording licensing for shops, social creators, events, films, and commercial campaigns.',
    deliverables: ['Direct artist master license', '24-bit lossless master WAV', 'Commercial usage clearance'],
    startingPrice: true,
  },
]

export const CREATIVE_SERVICES = REAL_DESS_SERVICES.map((s) => [s.name, s.description] as const)

export function getRealDessTrack(trackId: string) {
  return REAL_DESS_MEDIA.find((track) => track.id === trackId)
}

const media = (id: string, title: string, youtubeVideoId: string, type: MediaCatalogItem['type'] = 'music-video'): MediaCatalogItem => ({
  id, title, youtubeVideoId, type, category: 'music', youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
})

/** Canonical REAL DESS media catalogue. Keep variants separately selectable. */
export const REAL_DESS_MEDIA: MediaCatalogItem[] = [
  media('denny-bravo-freestyle', 'Denny Bravo Freestyle', '5TGTc1z6Zq0', 'freestyle'),
  media('cheda', 'Cheda', 'DIJu7ppS85o'), media('cheza', 'Cheza', 'LQQQ6d5AQq0'),
  media('kulevya', 'Kulevya', 'zHjDDJkmcyk'), media('kama-glu', 'Kama Glu', 'Aub9AJ78xUQ'),
  media('bey', 'Bey', '2bdwBG8foKw'), media('top', 'Top', 'FoGD1XVaruE'),
  media('kwaheri', 'Kwaheri', 'BBxRaXSOwsg'), media('mispendi', 'Mispendi', 'jDOFytU0RHc'),
  media('motion', 'Motion', 'nrknCWjsVys'), media('confident', 'Confident', 'tn0fG_Rzr_8'),
  media('pedigree', 'Pedigree', '5LoHAAAS160'), media('riri', 'Riri', '1-yUqlpQSWg'),
  media('do-for-love', 'Do for Love', 'QiamaADhvfA'), media('big-cat', 'Big Cat', '_j-hcMyPs0A'),
  media('kleen', 'Kleen', 'gs52QqsHyhI'), media('stamina', 'Stamina', 'hwN4hESY_ps'),
  media('chocha', 'Chocha', 'ffoTKomjNsg'), media('principles', 'Principles', 'NV10EMpL3rA'),
  media('taabu', 'Taabu', 'GucoPhr8alM'), media('lonely-nights', 'Lonely Nights', 'Tnn-nc_dDls'),
  media('kama-boss', 'Kama Boss', 'V2H485hMC4M'), media('meducation', 'Meducation', 'tQq1uFe1XGI'),
  media('momo', 'Momo', 'LqWRG42O8aw'), media('mitungi', 'Mitungi', 'OqVsuYcD7Kg'),
  media('harm', 'Harm', 'jHaq2-gp738'), media('interlude', 'Interlude', 'uItJfeiyDnk'),
  media('no-worry', 'No Worry', 'gk0Lqfgmo5g'), media('good-mood', 'Good Mood', 'u3rVHc5XDH8'),
  media('king-of-love', 'King of Love', '_6hUoBM_mD8'), media('koka-badi', 'Koka Badi', 'uRfoxpCcdhQ'),
  media('chekecha', 'Chekecha', 'GbrJkQ8j9fc'), media('chop-n-move-out', "Chop 'N' Move Out", 'jI64AqddZQA'),
  media('worry-lyric-video', 'Worry (Lyric Video)', 'refsblSyYWM', 'lyric-video'),
  media('nipigie-lyric-video', 'Nipigie (Lyric Video)', 'KrEjA9MCZcg', 'lyric-video'),
  media('kulevya-studio-session', 'Kulevya (X Trim Riddim) [Studio Session]', 'iimAPL9uOv0', 'studio-session'),
  media('kurrently', 'Kurrently', 'ILkGK8JmAM8'), media('kama-glu-visualizer', 'Kama Glu (Visualizer)', 'PaGdaRZzazQ', 'visualizer'),
  media('motion-official-main-video', 'Motion (official/main video)', 'O12VHA801Gs'),
  media('naiwake', 'Naiwake', 'd_EiC21zMzA'), media('wes-sy', 'Wes Sy', 'i9lSaLi56Xw'),
  media('sense-4wchimney', 'Dess - SENSE (4WCHIMNEY)', 'DT7GMx2CWQo'), media('borne-face', 'Borne Face', '0x7LRAA35vI'),
  media('zainabu', 'Zainabu', 'TxBzWGEiKok'), media('cure', 'Cure', 'Vi-K_HoU6So'),
]

export const VIDEO_FOR_PERFORMANCE_TRACK: Record<string, string> = { cure: 'cure', zainabu: 'zainabu' }

/** Deterministic motion assignment for every catalogue video, independent of audio availability. */
export const MEDIA_MOTION_IDS = ['hip_hop_dancing', 'hip_hop_dancing_1', 'hip_hop_dancing_2', 'robot_dance', 'bboy_move', 'sing'] as const
export function getMotionForMedia(id: string) {
  const index = REAL_DESS_MEDIA.findIndex((item) => item.id === id)
  return MEDIA_MOTION_IDS[Math.max(0, index) % MEDIA_MOTION_IDS.length]
}

export function getYouTubeEmbedUrl(item: MediaCatalogItem) {
  return `https://www.youtube-nocookie.com/embed/${item.youtubeVideoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
}
