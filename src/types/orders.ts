export type OrderType = 'merch' | 'license' | 'service' | 'support'

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled'

export interface BalaaOrder {
  id: string
  reference: string
  userId: string
  userEmail: string
  userName?: string
  type: OrderType
  itemId: string
  itemTitle: string
  amount: number
  currency: 'KSH' | 'USD'
  status: OrderStatus
  metadata?: {
    size?: string
    songId?: string
    songTitle?: string
    licenseId?: string
    licenseName?: string
    serviceId?: string
    serviceName?: string
    mpesaPhone?: string
    notes?: string
    [key: string]: any
  }
  createdAt: string
  confirmedAt?: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  source: string
  createdAt: string
  status: 'active' | 'unsubscribed'
}