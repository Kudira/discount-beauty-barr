import { createHmac, timingSafeEqual } from 'crypto'

// ── Paystack server helpers ─────────────────────────────────────────────────
// Server-only: these use PAYSTACK_SECRET_KEY. Never import from a client file.

export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? ''
const BASE = 'https://api.paystack.co'

import type { MomoProvider } from '@/lib/pos/momo-providers'

/** GHS → pesewas, rounded to avoid float drift (e.g. 19.99 * 100). */
export function toPesewas(amount: number): number {
  return Math.round(amount * 100)
}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set')
  return key
}

interface PaystackResponse<T> { status: boolean; message: string; data: T }

async function paystack<T>(path: string, init?: { method?: string; body?: unknown }): Promise<PaystackResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(25_000),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as PaystackResponse<T> | null
  if (!json) throw new Error(`Paystack returned an unreadable response (HTTP ${res.status})`)
  // Charge endpoints return HTTP 400 with status:false and a useful message.
  return json
}

export interface VerifiedTransaction {
  id: number
  status: string // success | failed | abandoned | ongoing | pending | reversed ...
  reference: string
  amount: number // pesewas
  currency: string
  channel: string // card | mobile_money | ...
  gateway_response: string
  paid_at: string | null
  metadata: Record<string, any> | null
}

export async function initializeTransaction(params: {
  email: string
  amount: number // GHS
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}) {
  return paystack<{ authorization_url: string; access_code: string; reference: string }>('/transaction/initialize', {
    method: 'POST',
    body: {
      email: params.email,
      amount: toPesewas(params.amount),
      currency: 'GHS',
      reference: params.reference,
      callback_url: params.callbackUrl,
      channels: ['card', 'mobile_money'],
      metadata: params.metadata,
    },
  })
}

export async function verifyTransaction(reference: string) {
  return paystack<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`)
}

export interface ChargeResult {
  reference: string
  status: string // pay_offline | send_otp | success | failed | pending
  display_text?: string
  message?: string
}

export async function chargeMobileMoney(params: {
  email: string
  amount: number // GHS
  phone: string
  provider: MomoProvider
  reference: string
  metadata?: Record<string, unknown>
}) {
  return paystack<ChargeResult>('/charge', {
    method: 'POST',
    body: {
      email: params.email,
      amount: toPesewas(params.amount),
      currency: 'GHS',
      reference: params.reference,
      mobile_money: { phone: params.phone, provider: params.provider },
      metadata: params.metadata,
    },
  })
}

export async function submitOtp(reference: string, otp: string) {
  return paystack<ChargeResult>('/charge/submit_otp', {
    method: 'POST',
    body: { reference, otp },
  })
}

/** Checks the x-paystack-signature header against the raw request body. */
export function isValidWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = Buffer.from(createHmac('sha512', secretKey()).update(rawBody).digest('hex'))
  const given = Buffer.from(signature)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

/** Normalises Ghana numbers to the local 0XXXXXXXXX format Paystack expects. */
export function normaliseGhanaPhone(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('233')) digits = '0' + digits.slice(3)
  if (digits.length === 9) digits = '0' + digits
  return /^0\d{9}$/.test(digits) ? digits : null
}
