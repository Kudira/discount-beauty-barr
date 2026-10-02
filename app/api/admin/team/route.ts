import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'

// Creates a dashboard login (admin / manager / read-only) directly from the
// Team & Access page. The account is created with the service role key and
// pre-confirmed, so it never depends on Supabase's signup confirmation email
// (which is rate-limited on the default mail service) and never has to go
// through /register.
const TEAM_ROLES = ['super_admin', 'admin', 'manager', 'read_only']

export async function POST(request: Request) {
  // Only super admins and admins may add dashboard users.
  const session = await createClient()
  const { data: { user: caller } } = await session.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const db = getServiceClient()
  const { data: callerProfile } = await db.from('profiles').select('role').eq('id', caller.id).single()
  if (!callerProfile || !['super_admin', 'admin'].includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Only an admin or super admin can add team members.' }, { status: 403 })
  }

  const { fullName, email, password, role } = await request.json().catch(() => ({}))

  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return NextResponse.json({ error: 'Enter their full name.' }, { status: 400 })
  }
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Temporary password must be at least 8 characters.' }, { status: 400 })
  }
  if (!TEAM_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Choose a valid role.' }, { status: 400 })
  }
  if (role === 'super_admin' && callerProfile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only a super admin can create another super admin.' }, { status: 403 })
  }

  const cleanEmail = email.trim().toLowerCase()
  const cleanName = fullName.trim()
  const columns = 'id, email, full_name, role, branch_id, pos_pin, created_at'

  const { data: created, error: authError } = await db.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: cleanName },
  })

  // Email already has an account (e.g. they signed up on the site as a
  // customer earlier) — promote that account instead of failing.
  if (authError || !created?.user) {
    const { data: existing } = await db.from('profiles').select('id').eq('email', cleanEmail).maybeSingle()
    if (existing) {
      const { data: promoted, error: promoteError } = await db
        .from('profiles')
        .update({ role })
        .eq('id', existing.id)
        .select(columns)
        .single()
      if (promoteError) {
        return NextResponse.json({ error: promoteError.message }, { status: 400 })
      }
      await db.from('activity_log').insert({
        action: 'team.role_granted',
        entity_type: 'user',
        entity_id: existing.id,
        details: { email: cleanEmail, role },
      })
      return NextResponse.json({ user: promoted, existing: true })
    }
    console.error('[team create]', authError)
    return NextResponse.json({ error: authError?.message ?? 'Could not create the account.' }, { status: 500 })
  }

  // The signup trigger already inserted a default 'customer' profile row —
  // upsert covers the case where the trigger didn't run.
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .upsert({ id: created.user.id, email: cleanEmail, full_name: cleanName, role }, { onConflict: 'id' })
    .select(columns)
    .single()

  if (profileError) {
    await db.auth.admin.deleteUser(created.user.id).catch(() => {})
    console.error('[team create] profile', profileError)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  await db.from('activity_log').insert({
    action: 'team.member_created',
    entity_type: 'user',
    entity_id: created.user.id,
    details: { email: cleanEmail, role },
  })

  return NextResponse.json({ user: profile })
}
