import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

// ── POS cashier session ─────────────────────────────────────────────────────
// The terminal itself is signed in to Supabase (e.g. a shared "till" account).
// On top of that, each cashier unlocks the till with their PIN. That unlock is
// stored in a signed, httpOnly cookie bound to the terminal's Supabase user, so
// it can't be forged in the browser or copied to another device.

export const POS_COOKIE = 'dbb_pos_session'
const SESSION_HOURS = 12

export interface PosSession {
  staffId: string
  name: string
  role: string
  branchId: string | null
  terminalUserId: string
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

export function encodeSession(data: Omit<PosSession, 'exp'>): { value: string; maxAge: number } {
  const session: PosSession = { ...data, exp: Date.now() + SESSION_HOURS * 3600_000 }
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return { value: `${payload}.${sign(payload)}`, maxAge: SESSION_HOURS * 3600 }
}

function decodeSession(value: string | undefined): PosSession | null {
  if (!value) return null
  const [payload, sig] = value.split('.')
  if (!payload || !sig) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const s = JSON.parse(Buffer.from(payload, 'base64url').toString()) as PosSession
    if (!s.exp || s.exp < Date.now()) return null
    return s
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

/** Returns the active cashier for this terminal, or null. Server-only. */
export async function getPosSession(): Promise<PosSession | null> {
  const cookieStore = await cookies()
  const session = decodeSession(cookieStore.get(POS_COOKIE)?.value)
  if (!session) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Session only counts on the terminal account it was created on.
  if (!user || user.id !== session.terminalUserId) return null
  return session
}
