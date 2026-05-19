import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  try {
    const { orderId, status } = await request.json()
    const admin = createAdminClient()

    const { error } = await admin
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await admin.from('activity_log').insert({
      action: 'order.status_updated',
      entity_type: 'order',
      entity_id: orderId,
      details: { to: status },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
