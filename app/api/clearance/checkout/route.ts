import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { initializeTransaction } from '@/lib/paystack'
import { DELIVERY_FEE, FREE_DELIVERY_MINIMUM } from '@/lib/constants'
import { getSiteOrigin } from '@/lib/site-url'
import { processingFeeFor } from '@/lib/fees'
import { insertOrderWithFee } from '@/lib/orders-insert'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { getCampaign, windowFor } from '@/lib/clearance'

interface Body {
  items: { variantId: string; quantity: number }[]
  customer: { firstName: string; lastName: string; email: string; phone: string }
  fulfillment: 'delivery' | 'pickup'
  branch?: string
  address?: string
  city?: string
  notes?: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Clearance checkout. Same shape as /api/checkout/initialize, with three extra
// rules enforced here on the server: the sale must be live, prices come from
// sale_items, and quantities cannot exceed what is left.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Your bag is empty.' }, { status: 400 })
  }
  const { customer, fulfillment } = body
  // Slow down scripts that spam orders (each order holds stock / starts a payment).
  if (!rateLimit(`checkout:ip:${clientIp(request)}`, 10, 10 * 60_000) ||
      (typeof customer?.email === 'string' && !rateLimit(`checkout:email:${customer.email.toLowerCase()}`, 5, 10 * 60_000))) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 })
  }
  if (!customer?.email || !/^\S+@\S+\.\S+$/.test(customer.email) || !customer.firstName?.trim()) {
    return NextResponse.json({ error: 'Enter your name and a valid email address.' }, { status: 400 })
  }
  if (!customer.phone?.trim()) {
    return NextResponse.json({ error: 'Enter a phone number we can reach you on.' }, { status: 400 })
  }
  if (fulfillment !== 'delivery' && fulfillment !== 'pickup') {
    return NextResponse.json({ error: 'Choose delivery or pickup.' }, { status: 400 })
  }
  if (fulfillment === 'delivery' && !body.address?.trim()) {
    return NextResponse.json({ error: 'Enter a delivery address.' }, { status: 400 })
  }

  for (const i of body.items) {
    if (typeof i.variantId !== 'string' || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 15) {
      return NextResponse.json({ error: 'Your bag has an invalid item. Refresh and try again.' }, { status: 400 })
    }
  }

  const db = getServiceClient()

  let branch: string | null = null
  if (fulfillment === 'pickup') {
    const { data: branches } = await db.from('branches').select('id').eq('is_active', true).order('name')
    const branchIds = (branches ?? []).map((b: any) => b.id as string)
    branch = branchIds.includes(body.branch ?? '') ? body.branch! : (branchIds[0] ?? null)
  }

  // ── The sale must be open right now ───────────────────────────────────────
  const campaign = await getCampaign()
  if (!campaign || !campaign.isEnabled) {
    return NextResponse.json({ error: 'The clearance sale is not available.' }, { status: 403 })
  }
  const win = windowFor(campaign)
  if (win === 'upcoming') return NextResponse.json({ error: 'The clearance sale has not opened yet.' }, { status: 403 })
  if (win === 'ended') return NextResponse.json({ error: 'The clearance sale has ended.' }, { status: 403 })

  // ── Price and stock-check from the sale tables ────────────────────────────
  const merged = new Map<string, number>()
  for (const i of body.items) merged.set(i.variantId, (merged.get(i.variantId) ?? 0) + i.quantity)
  const ids = [...merged.keys()]

  const [{ data: rows, error: rErr }, { data: avail }] = await Promise.all([
    db
      .from('sale_items')
      .select('variant_id, sale_price, product_variants(id, name, sku, products(name, brand))')
      .eq('campaign_id', campaign.id)
      .in('variant_id', ids),
    db.from('sale_item_availability').select('variant_id, remaining').eq('campaign_id', campaign.id).in('variant_id', ids),
  ])
  if (rErr) return NextResponse.json({ error: 'Could not load prices. Try again.' }, { status: 500 })

  const byId = new Map((rows ?? []).map((r: any) => [r.variant_id, r]))
  const left = new Map((avail ?? []).map((a: any) => [a.variant_id, Number(a.remaining)]))

  const lines: {
    variant_id: string; product_name: string; variant_name: string
    brand: string; sku: string; price: number; quantity: number
  }[] = []
  for (const [variantId, quantity] of merged) {
    const r: any = byId.get(variantId)
    const v = Array.isArray(r?.product_variants) ? r.product_variants[0] : r?.product_variants
    const p = Array.isArray(v?.products) ? v.products[0] : v?.products
    if (!r || !v || !p) {
      return NextResponse.json({ error: 'An item in your bag is not part of the sale. Remove it and try again.' }, { status: 409 })
    }
    const remaining = left.get(variantId) ?? 0
    if (quantity > remaining) {
      return NextResponse.json(
        {
          error: remaining > 0
            ? `Only ${remaining} left of ${p.brand} ${p.name}. Lower the quantity and try again.`
            : `${p.brand} ${p.name} just sold out. Remove it and try again.`,
        },
        { status: 409 }
      )
    }
    lines.push({
      variant_id: v.id,
      product_name: p.name,
      variant_name: v.name,
      brand: p.brand,
      sku: v.sku,
      price: Number(r.sale_price),
      quantity,
    })
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.quantity, 0))
  const deliveryFee = fulfillment === 'delivery' && subtotal < FREE_DELIVERY_MINIMUM ? DELIVERY_FEE : 0
  const total = round2(subtotal + deliveryFee)
  if (total <= 0) return NextResponse.json({ error: 'Order total must be more than zero.' }, { status: 400 })
  // Card / mobile money fee, worked out here so it cannot be changed from the browser.
  const processingFee = processingFeeFor(total)
  const payable = round2(total + processingFee)

  // ── Create the order (pending until paid) ─────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const customerName = `${customer.firstName} ${customer.lastName ?? ''}`.trim()
  const note = ['[Clearance sale]', body.notes?.trim()].filter(Boolean).join(' ')

  const { data: order, error: orderErr } = await insertOrderWithFee(db, {
    customer_id: user?.id ?? null,
    branch_id: branch,
    status: 'pending',
    fulfillment,
    customer_name: customerName,
    customer_email: customer.email.trim(),
    customer_phone: customer.phone.trim(),
    delivery_address: fulfillment === 'delivery' ? body.address!.trim() : null,
    delivery_city: fulfillment === 'delivery' ? body.city?.trim() || null : null,
    notes: note,
    subtotal, delivery_fee: deliveryFee, discount: 0, total: payable, processing_fee: processingFee,
    sale_campaign_id: campaign.id,
  })
  if (orderErr || !order) {
    console.error('[clearance] order insert', orderErr)
    return NextResponse.json({ error: 'Could not create your order. Try again.' }, { status: 500 })
  }

  const { error: itemsErr } = await db.from('order_items').insert(lines.map((l) => ({ ...l, order_id: order.id })))
  if (itemsErr) {
    await db.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    return NextResponse.json({ error: 'Could not save your order items. Try again.' }, { status: 500 })
  }

  // The check above and the insert are two steps, so two people buying the last
  // item at the same moment could both pass. Count again now that our order is
  // in (pending orders hold stock): if more is reserved than the sale has, back out.
  const { data: recheck } = await db
    .from('sale_item_availability')
    .select('variant_id, sale_qty, reserved')
    .eq('campaign_id', campaign.id)
    .in('variant_id', ids)
  if ((recheck ?? []).some((r: any) => Number(r.reserved) > Number(r.sale_qty))) {
    await db.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    return NextResponse.json({ error: 'Someone just bought the last of an item in your bag. Refresh and try again.' }, { status: 409 })
  }

  const reference = `${order.order_number}-${randomBytes(3).toString('hex')}`
  const { error: payErr } = await db.from('payments').insert({
    order_id: order.id,
    method: 'card', // updated to the real channel once Paystack confirms
    status: 'pending',
    amount: payable,
    reference,
  })
  if (payErr) {
    await db.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    return NextResponse.json({ error: 'Could not start payment. Try again.' }, { status: 500 })
  }

  // ── Start Paystack checkout ───────────────────────────────────────────────
  const origin = getSiteOrigin(request)
  try {
    const init = await initializeTransaction({
      email: customer.email.trim(),
      amount: payable,
      reference,
      callbackUrl: `${origin}/clearance/verify`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        source: 'online',
        campaign: campaign.slug,
        cancel_action: `${origin}/clearance`,
      },
    })
    if (!init.status) throw new Error(init.message)

    await db.from('activity_log').insert({
      user_id: user?.id ?? null,
      user_email: customer.email.trim(),
      action: 'order.created',
      entity_type: 'order',
      entity_id: order.id,
      details: { order_number: order.order_number, total: payable, processing_fee: processingFee, source: 'online', campaign: campaign.slug, status: 'awaiting payment' },
    })

    return NextResponse.json({ authorizationUrl: init.data.authorization_url, orderNumber: order.order_number })
  } catch (err: any) {
    console.error('[clearance] paystack init', err)
    await db.from('payments').update({ status: 'failed' }).eq('reference', reference)
    await db.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    return NextResponse.json({ error: 'Could not connect to the payment page. Try again.' }, { status: 502 })
  }
}
