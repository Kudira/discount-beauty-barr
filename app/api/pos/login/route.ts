import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { POS_COOKIE, encodeSession, sessionCookieOptions } from '@/lib/pos/session'

const STAFF_ROLES = ['super_admin', 'admin', 'manager', 'cashier']
const MAX_FAILURES = 5
const LOCKOUT_MINUTES = 10

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user: terminal } } = await supabase.auth.getUser()
  if (!terminal) return NextResponse.json({ error: 'This till is signed out. Sign in again.' }, { status: 401 })

  const { pin } = await request.json().catch(() => ({ pin: '' }))
  if (typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'Enter your 4–6 digit PIN.' }, { status: 400 })
  }

  const db = getServiceClient()

  // ── Lockout: too many wrong PINs on this till in a short window ──────────
  const windowStart = new Date(Date.now() - LOCKOUT_MINUTES * 60_000).toISOString()
  const { data: lastLogin } = await db
    .from('activity_log')
    .select('created_at')
    .eq('action', 'pos.login')
    .eq('details->>terminal_user_id', terminal.id)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const since = lastLogin?.created_at ?? windowStart
  const { count: failures } = await db
    .from('activity_log')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'pos.login_failed')
    .eq('user_id', terminal.id)
    .gt('created_at', since)

  if ((failures ?? 0) >= MAX_FAILURES) {
    return NextResponse.json(
      { error: `Too many wrong PINs. Try again in ${LOCKOUT_MINUTES} minutes.` },
      { status: 429 }
    )
  }

  // ── Find who this PIN belongs to ─────────────────────────────────────────
  const { data: matches, error } = await db
    .from('profiles')
    .select('id, email, full_name, role, branch_id')
    .eq('pos_pin', pin)
    .in('role', STAFF_ROLES)
    .limit(2)

  if (error) {
    console.error('[POS login]', error)
    return NextResponse.json({ error: 'Could not check PIN. Try again.' }, { status: 500 })
  }

  if (!matches || matches.length !== 1) {
    await db.from('activity_log').insert({
      user_id: terminal.id,
      user_email: terminal.email,
      action: 'pos.login_failed',
      entity_type: 'pos',
      details: {
        reason: matches && matches.length > 1 ? 'pin_shared_by_multiple_staff' : 'wrong_pin',
      },
    })
    if (matches && matches.length > 1) {
      return NextResponse.json(
        { error: 'This PIN is shared by more than one person. Ask an admin to reset it.' },
        { status: 409 }
      )
    }
    const left = MAX_FAILURES - (failures ?? 0) - 1
    return NextResponse.json(
      { error: left > 0 ? `Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.` : `Wrong PIN. Locked for ${LOCKOUT_MINUTES} minutes.` },
      { status: 401 }
    )
  }

  const staff = matches[0]
  const name = staff.full_name || staff.email || 'Staff'

  await db.from('activity_log').insert({
    user_id: staff.id,
    user_email: staff.email,
    user_role: staff.role,
    action: 'pos.login',
    entity_type: 'pos',
    details: {
      staff: name,
      branch: staff.branch_id ?? 'unassigned',
      terminal_user_id: terminal.id,
    },
  })

  const { value, maxAge } = encodeSession({
    staffId: staff.id,
    name,
    role: staff.role,
    branchId: staff.branch_id,
    terminalUserId: terminal.id,
  })

  const res = NextResponse.json({ name, role: staff.role, branchId: staff.branch_id })
  res.cookies.set(POS_COOKIE, value, { ...sessionCookieOptions, maxAge })
  return res
}
