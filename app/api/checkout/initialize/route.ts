import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { initializeTransaction } from '@/lib/paystack'
import { DELIVERY_FEE, FREE_DELIVERY_MINIMUM } from '@/lib/constants'
import { getSiteOrigin } from '@/lib/site-url'

interface Body {
  items: { variantId: string; quantity: number }[]
  customer: { firstName: string; lastName: string; email: string; phone: string }
  fulfillment: 'delivery' | 'pickup'
  branch?: string
  address?: string
  city?: string
  notes?: string
  promoCode?: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Creates the order from database prices (never the browser's) and starts a
// Paystack payment. The order stays "pending" until the payment is confirmed.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
  }
  const { customer, fulfillment } = body
  if (!customer?.email || !/^\S+@\S+\.\S+$/.test(customer.email) || !customer.firstName) {
    return NextResponse.json({ error: 'Enter your name and a valid email address.' }, { status: 400 })
  }
  if (fulfillment !== 'delivery' && fulfillment !== 'pickup') {
    return NextResponse.json({ error: 'Choose delivery or pickup.' }, { status: 400 })
  }
  if (fulfillment === 'delivery' && !body.address?.trim()) {
    return NextResponse.json({ error: 'Enter a delivery address.' }, { status: 400 })
  }
  const branch = fulfillment === 'pickup' ? (['osu', 'east-legon'].includes(body.branch ?? '') ? body.branch! : 'osu') : null

  for (const i of body.items) {
    if (typeof i.variantId !== 'string' || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99) {
      return NextResponse.json({ error: 'Your cart has an invalid item. Refresh and try again.' }, { status: 400 })
    }
  }

  const db = getServiceClient()

  // ── Price everything from the database ────────────────────────────────────
  const ids = [...new Set(body.items.map((i) => i.variantId))]
  const { data: variants, error: vErr } = await db
    .from('product_variants')
    .select('id, name, sku, price, products(name, brand, is_active)')
    .in('id', ids)
  if (vErr) return NextResponse.json({ error: 'Could not load prices. Try again.' }, { status: 500 })

  const byId = new Map((variants ?? []).map((v: any) => [v.id, v]))
  const lines: {
    variant_id: string; product_name: string; variant_name: string
    brand: string; sku: string; price: number; quantity: number
  }[] = []
  for (const i of body.items) {
    const v: any = byId.get(i.variantId)
    const product = Array.isArray(v?.products) ? v.products[0] : v?.products
    if (!v || !product || product.is_active === false) {
      return NextResponse.json({ error: 'An item in your cart is no longer available. Remove it and try again.' }, { status: 409 })
    }
    lines.push({
      variant_id: v.id,
      product_name: product.name,
      variant_name: v.name,
      brand: product.brand,
      sku: v.sku,
      price: Number(v.price),
      quantity: i.quantity,
    })
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.price * l.quantity, 0))
  const deliveryFee = fulfillment === 'delivery' && subtotal < FREE_DELIVERY_MINIMUM ? DELIVERY_FEE : 0

  // ── Promo code ────────────────────────────────────────────────────────────
  let discount = 0
  let promoCode: string | null = null
  if (body.promoCode?.trim()) {
    const code = body.promoCode.trim().toUpperCase()
    const { data: promo } = await db.from('promo_codes').select('*').eq('code', code).eq('is_active', true).maybeSingle()
    const expired = promo?.expires_at && new Date(promo.expires_at) < new Date()
    const usedUp = promo?.max_uses != null && promo.used_count >= promo.max_uses
    const belowMin = promo?.min_order && subtotal < Number(promo.min_order)
    if (!promo || expired || usedUp) {
      return NextResponse.json({ error: 'That promo code is invalid or has expired.' }, { status: 400 })
    }
    if (belowMin) {
      return NextResponse.json({ error: `That promo code needs an order of at least GHS ${Number(promo.min_order).toFixed(2)}.` }, { status: 400 })
    }
    discount = round2(Math.min(
      promo.discount_type === 'percentage' ? (subtotal * Number(promo.discount_value)) / 100 : Number(promo.discount_value),
      subtotal
    ))
    promoCode = promo.code
  }

  const total = round2(Math.max(0, subtotal + deliveryFee - discount))
  if (total <= 0) {
    return NextResponse.json({ error: 'Order total must be more than zero.' }, { status: 400 })
  }

  // ── Create the order (pending until paid) ─────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const customerName = `${customer.firstName} ${customer.lastName ?? ''}`.trim()

  const { data: order, error: orderErr } = await db.from('orders').insert({
    customer_id: user?.id ?? null,
    branch_id: branch,
    status: 'pending',
    fulfillment,
    customer_name: customerName,
    customer_email: customer.email.trim(),
    customer_phone: customer.phone?.trim() || null,
    delivery_address: fulfillment === 'delivery' ? body.address!.trim() : null,
    delivery_city: fulfillment === 'delivery' ? body.city?.trim() || null : null,
    notes: body.notes?.trim() || null,
    subtotal, delivery_fee: deliveryFee, discount, total,
  }).select('id, order_number').single()
  if (orderErr || !order) {
    console.error('[checkout] order insert', orderErr)
    return NextResponse.json({ error: 'Could not create your order. Try again.' }, { status: 500 })
  }

  const { error: itemsErr } = await db.from('order_items').insert(lines.map((l) => ({ ...l, order_id: order.id })))
  if (itemsErr) {
    await db.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    return NextResponse.json({ error: 'Could not save your order items. Try again.' }, { status: 500 })
  }

  const reference = `${order.order_number}-${randomBytes(3).toString('hex')}`
  const { error: payErr } = await db.from('payments').insert({
    order_id: order.id,
    method: 'card', // updated to the real channel once Paystack confirms
    status: 'pending',
    amount: total,
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
      amount: total,
      reference,
      callbackUrl: `${origin}/checkout/verify`,
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        source: 'online',
        promo_code: promoCode,
        cancel_action: `${origin}/checkout`,
      },
    })
    if (!init.status) throw new Error(init.message)

    await db.from('activity_log').insert({
      user_id: user?.id ?? null,
      user_email: customer.email.trim(),
      action: 'order.created',
      entity_type: 'order',
      entity_id: order.id,
      details: { order_number: order.order_number, total, source: 'online', status: 'awaiting payment' },
    })

    return NextResponse.json({ authorizationUrl: init.data.authorization_url, orderNumber: order.order_number })
  } catch (err: any) {
    console.error('[checkout] paystack init', err)
    await db.from('payments').update({ status: 'failed' }).eq('reference', reference)
    await db.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    return NextResponse.json({ error: 'Could not connect to the payment page. Try again.' }, { status: 502 })
  }
}
