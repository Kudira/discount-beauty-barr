import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getPosSession } from '@/lib/pos/session'
import { toPesewas, verifyTransaction } from '@/lib/paystack'

// POS method ids → payments.method enum ('card' | 'mobile_money' | 'cash' | 'bank_transfer')
const METHOD_TO_DB: Record<string, string> = {
  cash: 'cash',
  card: 'card',
  momo: 'mobile_money',
}

interface IncomingPayment {
  method: 'cash' | 'card' | 'momo'
  amount: number
  provider?: string          // momo network (mtn | vod | atl)
  paystackReference?: string // set when MoMo was charged through Paystack
}

export async function POST(request: Request) {
  const session = await getPosSession()
  if (!session) {
    return NextResponse.json({ error: 'Your POS session has ended. Sign in with your PIN again.' }, { status: 401 })
  }

  try {
    const { orderData, orderItems, payments } = (await request.json()) as {
      orderData: Record<string, any>
      orderItems: Record<string, any>[]
      payments: IncomingPayment[]
    }
    const db = getServiceClient()

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: 'No payment recorded for this sale.' }, { status: 400 })
    }
    for (const p of payments) {
      if (!METHOD_TO_DB[p.method]) {
        return NextResponse.json({ error: `Unknown payment method: ${p.method}` }, { status: 400 })
      }
    }

    // ── Paystack MoMo: confirm the money actually arrived before saving ──────
    for (const p of payments.filter((x) => x.paystackReference)) {
      const ref = p.paystackReference!
      const { data: existing } = await db.from('payments').select('id').eq('reference', ref).maybeSingle()
      if (existing) {
        return NextResponse.json({ error: 'This mobile money payment was already used for another sale.' }, { status: 409 })
      }
      const verified = await verifyTransaction(ref)
      if (!verified.status || verified.data?.status !== 'success') {
        return NextResponse.json({ error: 'Mobile money payment is not confirmed yet.' }, { status: 402 })
      }
      if (verified.data.currency !== 'GHS' || verified.data.amount !== toPesewas(p.amount)) {
        return NextResponse.json({ error: 'Mobile money amount does not match this sale.' }, { status: 409 })
      }
    }

    // ── Order ─────────────────────────────────────────────────────────────────
    const { data: order, error: orderError } = await db
      .from('orders')
      .insert(orderData)
      .select('id, order_number')
      .single()
    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 400 })
    }

    const problems: string[] = []

    if (orderItems?.length > 0) {
      const { error } = await db.from('order_items').insert(
        orderItems.map((item) => ({ ...item, order_id: order.id }))
      )
      if (error) problems.push(`items: ${error.message}`)
    }

    // ── One payment row per method (split payments included) ─────────────────
    const paidAt = new Date().toISOString()
    const { error: payError } = await db.from('payments').insert(
      payments.map((p, i) => ({
        order_id: order.id,
        method: METHOD_TO_DB[p.method],
        status: 'success',
        amount: p.amount,
        reference: p.paystackReference ?? (i === 0 ? order.order_number : `${order.order_number}-${i + 1}`),
        paystack_reference: p.paystackReference ?? null,
        paid_at: paidAt,
      }))
    )
    if (payError) problems.push(`payments: ${payError.message}`)

    await db.from('activity_log').insert({
      user_id: session.staffId,
      user_role: session.role,
      action: 'pos.sale',
      entity_type: 'order',
      entity_id: order.id,
      details: {
        staff: session.name,
        order_number: order.order_number,
        total: orderData.total,
        items: orderItems?.length ?? 0,
        branch: orderData.branch_id,
        paid_by: payments
          .map((p) => (p.method === 'momo' && p.provider ? `momo (${p.provider})` : p.method))
          .join(' + '),
        ...(problems.length ? { save_warnings: problems.join('; ') } : {}),
      },
    })

    if (problems.length) {
      console.error('[POS API] partial save', order.order_number, problems)
      return NextResponse.json(
        { success: true, partial: true, orderId: order.id, orderNumber: order.order_number, warning: problems.join('; ') },
        { status: 207 }
      )
    }

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.order_number })
  } catch (err: any) {
    console.error('[POS API]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
