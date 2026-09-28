import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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
    const updates: Record<string, any> = {}
    if (role !== undefined) updates.role = role
    if (branch_id !== undefined) updates.branch_id = branch_id || null
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
