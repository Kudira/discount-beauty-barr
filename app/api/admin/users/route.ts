import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireManager, requireAdmin, authErrorResponse } from '@/lib/auth/guards'

const ROLES = ['super_admin', 'admin', 'manager', 'cashier', 'read_only', 'customer']

function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { userId, role, branch_id, pos_pin } = body
    if (typeof userId !== 'string' || !userId) return NextResponse.json({ error: 'Choose a user.' }, { status: 400 })

    // Roles and branches: admins only. (PIN handling below is unchanged.)
    const changesAccess = role !== undefined || branch_id !== undefined
    const caller = changesAccess ? await requireAdmin() : await requireManager()

    const updates: Record<string, any> = {}
    if (changesAccess) {
      if (role !== undefined) {
        if (!ROLES.includes(role)) return NextResponse.json({ error: 'Unknown role.' }, { status: 400 })
        if (userId === caller.id) return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 403 })
        const { data: target } = await getAdmin().from('profiles').select('role').eq('id', userId).maybeSingle()
        if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 })
        if ((role === 'super_admin' || target.role === 'super_admin') && caller.role !== 'super_admin') {
          return NextResponse.json({ error: 'Only a super admin can grant or remove super admin.' }, { status: 403 })
        }
        updates.role = role
      }
      if (branch_id !== undefined) updates.branch_id = branch_id || null
    }
    if (pos_pin !== undefined) {
      if (pos_pin !== null && (typeof pos_pin !== 'string' || !/^\d{4,6}$/.test(pos_pin))) {
        return NextResponse.json({ error: 'PIN must be 4–6 digits' }, { status: 400 })
      }
      if (pos_pin) {
        // PINs identify staff at the till, so no two people can share one.
        const { data: taken } = await getAdmin()
          .from('profiles')
          .select('id')
          .eq('pos_pin', pos_pin)
          .neq('id', userId)
          .limit(1)
        if (taken && taken.length > 0) {
          return NextResponse.json({ error: 'That PIN is already used by someone else. Choose another.' }, { status: 409 })
        }
      }
      updates.pos_pin = pos_pin
    }

    const { error } = await getAdmin()
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'That PIN is already used by someone else. Choose another.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return authErrorResponse(err) ?? NextResponse.json({ error: err.message }, { status: 500 })
  }
}
