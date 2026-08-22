export interface MerchItem {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  sizes: string[]
  stripePriceId: string
  mpesaPriceId?: string
  meshName: string
}