import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderData, orderItems } = body

    // Use admin client to bypass RLS completely
    const admin = createAdminClient()

    // Get current user if logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({ ...orderData, customer_id: user?.id ?? null })
      .select()
      .single()

    if (orderError) {
      console.error('Order insert error:', orderError)
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    const { error: itemsError } = await admin
      .from('order_items')
      .insert(orderItems.map((item: any) => ({ ...item, order_id: order.id })))

    if (itemsError) {
      console.error('Order items error:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 400 })
    }

    // Log activity
    await admin.from('activity_log').insert({
      user_id: user?.id ?? null,
      user_email: orderData.customer_email,
      action: 'order.created',
      entity_type: 'order',
      entity_id: order.id,
      details: { order_number: order.order_number, total: orderData.total, source: 'online' },
    })

    return NextResponse.json({ order })
  } catch (err: any) {
    console.error('Order API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
