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
    const { id, quantity } = await request.json()
    const admin = getAdmin()

    const { error } = await admin
      .from('inventory')
      .update({ quantity })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { fromId, fromQty, toId, toQty } = await request.json()
    const admin = getAdmin()

    await Promise.all([
      admin.from('inventory').update({ quantity: fromQty }).eq('id', fromId),
      admin.from('inventory').update({ quantity: toQty }).eq('id', toId),
    ])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
