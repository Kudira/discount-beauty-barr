import { NextResponse } from 'next/server'
import { randomUUID, randomBytes } from 'crypto'
import { getServiceClient } from '@/lib/supabase/service'
import { requireManager, authErrorResponse } from '@/lib/auth/guards'

// Creates a staff record with no email/password login — the person only
// ever signs in at the till with a PIN. A hidden auth.users row is still
// created behind the scenes (profiles.id requires one), with a random
// password nobody is given and an unreachable @pos.internal email, so it
// can never be used to log in to the website or admin dashboard.
export async function POST(request: Request) {
  try { await requireManager() } catch (e) { return authErrorResponse(e) ?? NextResponse.json({ error: 'Not allowed' }, { status: 403 }) }
  const { fullName, branchId, posPin } = await request.json().catch(() => ({}))

  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return NextResponse.json({ error: 'Enter the cashier’s name.' }, { status: 400 })
  }
  if (posPin && !/^\d{4,6}$/.test(posPin)) {
    return NextResponse.json({ error: 'PIN must be 4–6 digits.' }, { status: 400 })
  }

  const db = getServiceClient()

  if (branchId) {
    const { data: branch } = await db.from('branches').select('id').eq('id', branchId).maybeSingle()
    if (!branch) return NextResponse.json({ error: 'Choose a valid branch.' }, { status: 400 })
  }

  if (posPin) {
    const { data: taken } = await db.from('profiles').select('id').eq('pos_pin', posPin).limit(1)
    if (taken && taken.length > 0) {
      return NextResponse.json({ error: 'That PIN is already used by someone else. Choose another.' }, { status: 409 })
    }
  }

  // Unreachable placeholder email — required by auth.users, never emailed to.
  const placeholderEmail = `cashier.${randomUUID()}@pos.internal`

  const { data: created, error: authError } = await db.auth.admin.createUser({
    email: placeholderEmail,
    password: randomBytes(24).toString('hex'),
    email_confirm: true,
    user_metadata: { full_name: fullName.trim(), pos_only: true },
  })
  if (authError || !created?.user) {
    console.error('[staff create]', authError)
    return NextResponse.json({ error: 'Could not create the staff record. Try again.' }, { status: 500 })
  }

  // The signup trigger already inserted a default 'customer' profile row —
  // update it in place rather than inserting a second one.
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .update({
      full_name: fullName.trim(),
      role: 'cashier',
      branch_id: branchId || null,
      pos_pin: posPin || null,
    })
    .eq('id', created.user.id)
    .select('id, email, full_name, role, branch_id, pos_pin, created_at')
    .single()

  if (profileError) {
    await db.auth.admin.deleteUser(created.user.id).catch(() => {})
    if (profileError.code === '23505') {
      return NextResponse.json({ error: 'That PIN is already used by someone else. Choose another.' }, { status: 409 })
    }
    console.error('[staff create] profile', profileError)
    return NextResponse.json({ error: 'Could not save the staff record. Try again.' }, { status: 500 })
  }

  await db.from('activity_log').insert({
    action: 'staff.created',
    entity_type: 'user',
    entity_id: created.user.id,
    details: { staff: fullName.trim(), branch: branchId || 'unassigned', pin_set: Boolean(posPin) },
  })

  return NextResponse.json({ user: profile })
}
