import { getServiceClient } from '@/lib/supabase/service'
import { toPesewas, verifyTransaction } from '@/lib/paystack'
import { sendEmailServer } from '@/lib/email/sendEmailServer'
import { orderConfirmationTemplate } from '@/lib/email/templates'
import { BRANCHES } from '@/lib/constants'
import { alreadyDeducted, deductForOnlineOrder } from '@/lib/stock'

export type ConfirmResult =
  | { state: 'paid'; orderNumber: string }
  | { state: 'pending'; orderNumber: string }
  | { state: 'failed'; orderNumber?: string; message: string }

/**
 * Confirms an online (website) payment with Paystack and marks the order paid.
 * Safe to call more than once for the same reference — the callback page and
 * the webhook both call it, and only the first one does the work.
 */
export async function confirmOnlinePayment(reference: string): Promise<ConfirmResult> {
  const db = getServiceClient()

  const { data: payment } = await db
    .from('payments')
    .select('id, status, amount, order_id, orders(id, order_number, status, customer_name, customer_email, fulfillment, delivery_address, branch_id, subtotal, delivery_fee, discount, total, processing_fee, sale_campaign_id)')
    .eq('reference', reference)
    .maybeSingle()

  if (!payment) return { state: 'failed', message: 'We could not find this payment.' }
  const order: any = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders
  const orderNumber: string = order?.order_number

  if (payment.status === 'success') return { state: 'paid', orderNumber }

  const verified = await verifyTransaction(reference)
  const tx = verified.data
  if (!verified.status || !tx) return { state: 'pending', orderNumber }

  if (tx.status !== 'success') {
    if (tx.status === 'failed' || tx.status === 'reversed') {
      await db.from('payments').update({ status: 'failed' }).eq('id', payment.id).eq('status', 'pending')
      return { state: 'failed', orderNumber, message: tx.gateway_response || 'The payment was declined.' }
    }
    if (tx.status === 'abandoned') {
      return { state: 'failed', orderNumber, message: 'The payment was not completed.' }
    }
    return { state: 'pending', orderNumber }
  }

  // Money received — make sure it's the right amount before confirming.
  if (tx.currency !== 'GHS' || tx.amount !== toPesewas(Number(payment.amount))) {
    await db.from('activity_log').insert({
      action: 'payment.amount_mismatch',
      entity_type: 'order',
      entity_id: payment.order_id,
      details: { order_number: orderNumber, expected: Number(payment.amount), received: tx.amount / 100, reference },
    })
    return { state: 'failed', orderNumber, message: 'The amount paid does not match your order. We will contact you.' }
  }

  // Only the first caller flips pending → success (webhook vs. callback race).
  const { data: claimed } = await db
    .from('payments')
    .update({
      status: 'success',
      method: tx.channel === 'mobile_money' ? 'mobile_money' : 'card',
      paystack_reference: String(tx.id),
      paid_at: tx.paid_at ?? new Date().toISOString(),
    })
    .eq('id', payment.id)
    .eq('status', 'pending')
    .select('id')

  if (!claimed || claimed.length === 0) return { state: 'paid', orderNumber }

  await db.from('orders').update({ status: 'confirmed' }).eq('id', payment.order_id).eq('status', 'pending')

  // Take the items off the shelves (once). Clearance-campaign orders are
  // counted by the sale itself, not by inventory. Never blocks the payment.
  try {
    if (!order?.sale_campaign_id && !(await alreadyDeducted(payment.order_id))) {
      const { data: stockItems } = await db.from('order_items').select('variant_id, quantity').eq('order_id', payment.order_id)
      await deductForOnlineOrder(
        payment.order_id,
        order?.fulfillment === 'pickup' ? order?.branch_id ?? null : null,
        (stockItems ?? []) as any
      )
    }
  } catch (err) {
    console.error('[confirmOnlinePayment] stock update failed', err)
  }

  // Count the promo code use now that it's paid for.
  const promo = tx.metadata?.promo_code
  if (promo) {
    const { data: code } = await db.from('promo_codes').select('id, used_count').eq('code', promo).maybeSingle()
    if (code) await db.from('promo_codes').update({ used_count: (code.used_count ?? 0) + 1 }).eq('id', code.id)
  }

  await db.from('activity_log').insert({
    user_email: order?.customer_email,
    action: 'payment.success',
    entity_type: 'order',
    entity_id: payment.order_id,
    details: { order_number: orderNumber, total: Number(payment.amount), channel: tx.channel, source: 'online' },
  })

  // Confirmation email — failures here never undo the payment.
  try {
    const { data: items } = await db
      .from('order_items')
      .select('product_name, variant_name, quantity, price')
      .eq('order_id', payment.order_id)
    const { subject, html } = orderConfirmationTemplate({
      customerName: (order?.customer_name ?? '').split(' ')[0] || 'there',
      orderNumber,
      items: (items ?? []).map((i: any) => ({ name: i.product_name, variantName: i.variant_name, quantity: i.quantity, price: Number(i.price) })),
      subtotal: Number(order?.subtotal ?? 0),
      deliveryFee: Number(order?.delivery_fee ?? 0),
      discount: Number(order?.discount ?? 0),
      processingFee: Number(order?.processing_fee ?? 0),
      total: Number(order?.total ?? 0),
      fulfillment: order?.fulfillment,
      deliveryAddress: order?.fulfillment === 'delivery' ? order?.delivery_address ?? undefined : undefined,
      branchName: order?.fulfillment === 'pickup' ? BRANCHES.find((b) => b.id === order?.branch_id)?.name : undefined,
    })
    if (order?.customer_email) {
      await sendEmailServer({ to: order.customer_email, subject, html, orderId: payment.order_id, template: 'order_confirmation' })
    }
  } catch (err) {
    console.error('[confirmOnlinePayment] email failed', err)
  }

  return { state: 'paid', orderNumber }
}
