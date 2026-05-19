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
    if (pos_pin !== undefined) updates.pos_pin = pos_pin

    const { error } = await getAdmin()
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
