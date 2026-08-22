/**
 * Manual M-Pesa Till Payment Configuration
 *
 * No automated API integration (Daraja/Stripe removed).
 * Displays the Till number and order reference for the customer
 * to pay manually. Confirmation is handled semi-manually by admin.
 */

export const MPESA_TILL_NUMBER = '5834631'

export const MPESA_INSTRUCTIONS = [
  'Open M-Pesa on your phone',
  'Select "Lipa na M-Pesa" → "Buy Goods and Services"',
  `Enter Till Number: ${MPESA_TILL_NUMBER}`,
  'Enter the amount shown below',
  'Use the Order Reference as your M-Pesa reference',
  'Send a screenshot of your confirmation to our WhatsApp/support',
]

/**
 * Generates a short, unique order reference for manual payment tracking.
 * Format: BALAA-<base36-timestamp>-<random-4-chars>
 */
export function generateOrderReference(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `BALAA-${ts}-${rand}`
}

/**
 * Formats a price in KSh for display.
 */
export function formatKshPrice(price: number): string {
  return `KSh ${price.toLocaleString('en-KE')}`
}
