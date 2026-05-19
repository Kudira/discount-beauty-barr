import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  try {
    const { orderData, orderItems, payment, cashierName } = await request.json()
    const admin = getAdmin()

    // Create order
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert(orderData)
      .select('id, order_number')
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    // Create order items
    if (orderItems?.length > 0) {
      await admin.from('order_items').insert(
        orderItems.map((item: any) => ({ ...item, order_id: order.id }))
      )
    }

    // Create payment record
    if (payment) {
      await admin.from('payments').insert({
        order_id: order.id,
        method: payment.method,
        status: 'success',
        amount: payment.amount,
        reference: orderData.order_number,
      })
    }

    // Log activity
    await admin.from('activity_log').insert({
      action: 'pos.sale',
      entity_type: 'order',
      entity_id: order.id,
      details: {
        order_number: order.order_number,
        total: orderData.total,
        items: orderItems?.length ?? 0,
        cashier: cashierName,
        branch: orderData.branch_id,
      },
    })

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.order_number })
  } catch (err: any) {
    console.error('[POS API]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
