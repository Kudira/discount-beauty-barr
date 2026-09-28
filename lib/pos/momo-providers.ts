// Client-safe list of Ghana mobile money networks and their Paystack codes.
export type MomoProvider = 'mtn' | 'vod' | 'atl'

export const MOMO_PROVIDERS: { id: MomoProvider; label: string }[] = [
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'vod', label: 'Telecel Cash' }, // formerly Vodafone Cash
  { id: 'atl', label: 'AT Money' },     // formerly AirtelTigo Money
]

export const MOMO_LABELS: Record<string, string> = Object.fromEntries(
  MOMO_PROVIDERS.map((p) => [p.id, p.label])
)
