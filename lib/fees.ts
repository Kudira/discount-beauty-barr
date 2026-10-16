// Card / mobile money processing fee, passed on to the customer.
// One rule used everywhere (website checkout, clearance checkout, the till) so
// the amounts can never drift apart. Safe to import from browser and server code.

export const PROCESSING_FEE_RATE = 0.0195 // 1.95%
export const PROCESSING_FEE_LABEL = 'Card / MoMo processing fee (1.95%)'

/** 1.95% of `amount` (GHS), rounded to the nearest pesewa. Integer maths, no float drift. */
export function processingFeeFor(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.round((Math.round(amount * 100) * 195) / 10000) / 100
}

/** What the customer pays: the amount plus the fee. */
export function withProcessingFee(amount: number): number {
  return Math.round((Math.round(amount * 100) + Math.round(processingFeeFor(amount) * 100))) / 100
}
