import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getPosSession } from '@/lib/pos/session'
import { toPesewas, verifyTransaction } from '@/lib/paystack'
import { checkTillSale } from '@/lib/clearance'
import { processingFeeFor } from '@/lib/fees'
import { insertOrderWithFee } from '@/lib/orders-insert'
import { deductAtBranch } from '@/lib/stock'

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

    // A cashier with an assigned branch can only ever sell under that
    // branch — enforced here too, not just by hiding the picker in the UI,
    // since a request can be sent directly without going through the page.
    if (session.branchId) {
      orderData.branch_id = session.branchId
    }

    if (!Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json({ error: 'No payment recorded for this sale.' }, { status: 400 })
    }
    for (const p of payments) {
      if (!METHOD_TO_DB[p.method]) {
        return NextResponse.json({ error: `Unknown payment method: ${p.method}` }, { status: 400 })
      }
    }

    // ── Clearance sale: prices and stock are checked here, not trusted from
    // the browser, and the order is tagged so the website's stock count drops.
    const sale = await checkTillSale(orderItems ?? [])
    if (sale.error) {
      return NextResponse.json({ error: sale.error }, { status: 409 })
    }
    if (sale.campaignId) orderData.sale_campaign_id = sale.campaignId

    // ── Processing fee: charged only when the money went through Paystack, and
    // it must be exactly 1.95% of what the goods came to.
    const fee = Number(orderData.processing_fee ?? 0)
    const viaPaystack = payments.some((p) => p.paystackReference)
    const goodsTotal = Math.round((Number(orderData.total) - fee) * 100) / 100
    const expectedFee = viaPaystack ? processingFeeFor(goodsTotal) : 0
    if (Math.abs(fee - expectedFee) > 0.005) {
      return NextResponse.json({ error: 'The mobile money fee on this sale is not correct. Refresh the till and try again.' }, { status: 409 })
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
    const { data: order, error: orderError } = await insertOrderWithFee(db, orderData)
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

    // ── Stock: take the items off this branch's shelf. Clearance-sale lines are
    // tracked by the sale itself. If an item was at 0 (new stock not recorded
    // yet) the count goes negative and the till is told, so it can be fixed in
    // Admin > Inventory later. Stock problems never block or undo a sale.
    let negativeStock: { variantId: string; sku?: string; name?: string; now: number }[] = []
    try {
      const clearanceIds = new Set(sale.clearanceVariantIds ?? [])
      const stockLines = (orderItems ?? [])
        .filter((i) => i.variant_id && !clearanceIds.has(i.variant_id))
        .map((i) => ({ variant_id: i.variant_id as string, quantity: Number(i.quantity) }))
      if (stockLines.length > 0 && orderData.branch_id) {
        const result = await deductAtBranch(order.id, orderData.branch_id, stockLines)
        negativeStock = result.negative.map((m) => {
          const line = (orderItems ?? []).find((i) => i.variant_id === m.variantId)
          return { variantId: m.variantId, sku: line?.sku, name: line ? `${line.product_name} (${line.variant_name})` : undefined, now: m.after }
        })
      }
    } catch (e) {
      console.error('[POS API] stock update failed', e)
    }

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
        ...(negativeStock.length ? { negative_stock: negativeStock } : {}),
        ...(problems.length ? { save_warnings: problems.join('; ') } : {}),
      },
    })

    if (problems.length) {
      console.error('[POS API] partial save', order.order_number, problems)
      return NextResponse.json(
        { success: true, partial: true, orderId: order.id, orderNumber: order.order_number, warning: problems.join('; '), negativeStock },
        { status: 207 }
      )
    }

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.order_number, negativeStock })
  } catch (err: any) {
    console.error('[POS API]', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
