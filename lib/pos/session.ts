import { randomUUID, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

// ── POS cashier session ─────────────────────────────────────────────────────
// By design, the till itself has no staff login — the PIN is the only thing
// protecting it (wrong-PIN lockout is the safeguard). Once a PIN checks out,
// that unlock is stored in a signed, httpOnly cookie, so it can't be forged
// or edited from the browser.

export const POS_COOKIE = 'dbb_pos_session'
export const POS_TERMINAL_COOKIE = 'dbb_pos_terminal' // anonymous, scopes PIN-lockout counting to this browser
const SESSION_HOURS = 12
const TERMINAL_ID_DAYS = 3650

export interface PosSession {
  staffId: string
  name: string
  role: string
  branchId: string | null
  exp: number // unix ms
}

function secret(): string {
  const s = process.env.POS_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('POS_SESSION_SECRET is not set')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

function encode(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${sign(body)}`
}

function decode<T>(value: string | undefined): T | null {
  if (!value) return null
  const [body, sig] = value.split('.')
  if (!body || !sig) return null
  const expected = Buffer.from(sign(body))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString()) as T
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

export function encodeSession(data: Omit<PosSession, 'exp'>): { value: string; maxAge: number } {
  const session: PosSession = { ...data, exp: Date.now() + SESSION_HOURS * 3600_000 }
  return { value: encode(session), maxAge: SESSION_HOURS * 3600 }
}

/** Returns the active cashier for this browser, or null. Server-only. */
export async function getPosSession(): Promise<PosSession | null> {
  const cookieStore = await cookies()
  const session = decode<PosSession>(cookieStore.get(POS_COOKIE)?.value)
  if (!session || !session.exp || session.exp < Date.now()) return null
  return session
}

/**
 * A random, signed id for this browser — not tied to any person. Used only
 * to scope the wrong-PIN lockout to "this till", so one bad PIN attempt on
 * one register doesn't lock out every other till in the shop. Created on
 * first use if missing.
 */
export async function getOrCreateTerminalId(): Promise<{ id: string; cookie?: { value: string; maxAge: number } }> {
  const cookieStore = await cookies()
  const existing = decode<{ id: string }>(cookieStore.get(POS_TERMINAL_COOKIE)?.value)
  if (existing?.id) return { id: existing.id }
  const id = randomUUID()
  return { id, cookie: { value: encode({ id }), maxAge: TERMINAL_ID_DAYS * 86400 } }
}
