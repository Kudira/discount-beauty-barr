import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { POS_COOKIE, POS_TERMINAL_COOKIE, encodeSession, getOrCreateTerminalId, sessionCookieOptions } from '@/lib/pos/session'

const STAFF_ROLES = ['super_admin', 'admin', 'manager', 'cashier']
const MAX_FAILURES = 5
const LOCKOUT_MINUTES = 10

export async function POST(request: Request) {
  const { pin } = await request.json().catch(() => ({ pin: '' }))
  if (typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'Enter your 4–6 digit PIN.' }, { status: 400 })
  }

  const { id: terminalId, cookie: terminalCookie } = await getOrCreateTerminalId()
  const db = getServiceClient()

  // ── Lockout: too many wrong PINs on this browser/till in a short window ──
  const windowStart = new Date(Date.now() - LOCKOUT_MINUTES * 60_000).toISOString()
  const { count: failures } = await db
    .from('activity_log')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'pos.login_failed')
    .eq('details->>terminal_id', terminalId)
    .gte('created_at', windowStart)

  if ((failures ?? 0) >= MAX_FAILURES) {
    return NextResponse.json(
      { error: `Too many wrong PINs on this till. Try again in ${LOCKOUT_MINUTES} minutes.` },
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

  const setTerminalCookie = (res: NextResponse) => {
    if (terminalCookie) res.cookies.set(POS_TERMINAL_COOKIE, terminalCookie.value, { ...sessionCookieOptions, maxAge: terminalCookie.maxAge })
    return res
  }

  if (!matches || matches.length !== 1) {
    await db.from('activity_log').insert({
      action: 'pos.login_failed',
      entity_type: 'pos',
      details: {
        terminal_id: terminalId,
        reason: matches && matches.length > 1 ? 'pin_shared_by_multiple_staff' : 'wrong_pin',
      },
    })
    if (matches && matches.length > 1) {
      return setTerminalCookie(NextResponse.json(
        { error: 'This PIN is shared by more than one person. Ask an admin to reset it.' },
        { status: 409 }
      ))
    }
    const left = MAX_FAILURES - (failures ?? 0) - 1
    return setTerminalCookie(NextResponse.json(
      { error: left > 0 ? `Wrong PIN. ${left} ${left === 1 ? 'try' : 'tries'} left.` : `Wrong PIN. This till is locked for ${LOCKOUT_MINUTES} minutes.` },
      { status: 401 }
    ))
  }

  const staff = matches[0]
  const name = staff.full_name || staff.email || 'Staff'

  await db.from('activity_log').insert({
    user_id: staff.id,
    user_email: staff.email,
    user_role: staff.role,
    action: 'pos.login',
    entity_type: 'pos',
    details: { staff: name, branch: staff.branch_id ?? 'unassigned', terminal_id: terminalId },
  })

  const { value, maxAge } = encodeSession({
    staffId: staff.id,
    name,
    role: staff.role,
    branchId: staff.branch_id,
  })

  const res = NextResponse.json({ name, role: staff.role, branchId: staff.branch_id })
  res.cookies.set(POS_COOKIE, value, { ...sessionCookieOptions, maxAge })
  return setTerminalCookie(res)
}
