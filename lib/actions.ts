'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Admin client with service role — bypasses ALL RLS policies
function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ── Orders ──────────────────────────────────────────────────────────────────
export async function createOrder(data: Record<string, any>) {
  const admin = getAdmin()
  const { data: order, error } = await admin
    .from('orders')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return order
}

export async function createOrderItems(items: Record<string, any>[]) {
  const admin = getAdmin()
  const { error } = await admin.from('order_items').insert(items)
  if (error) throw new Error(error.message)
}

export async function updateOrderStatus(orderId: string, status: string) {
  const admin = getAdmin()
  const { error } = await admin
    .from('orders')
    .update({ status })
    .eq('id', orderId)
  if (error) throw new Error(error.message)
}

// ── Products ─────────────────────────────────────────────────────────────────
export async function createProduct(data: Record<string, any>) {
  const admin = getAdmin()
  const { data: product, error } = await admin
    .from('products')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return product
}

export async function updateProduct(id: string, data: Record<string, any>) {
  const admin = getAdmin()
  const { error } = await admin
    .from('products')
    .update(data)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createVariant(data: Record<string, any>) {
  const admin = getAdmin()
  const { data: variant, error } = await admin
    .from('product_variants')
    .insert(data)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return variant
}

export async function updateVariant(id: string, data: Record<string, any>) {
  const admin = getAdmin()
  const { error } = await admin
    .from('product_variants')
    .update(data)
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export async function createInventoryRows(rows: Record<string, any>[]) {
  const admin = getAdmin()
  const { error } = await admin.from('inventory').insert(rows)
  if (error) console.warn('Inventory insert warn:', error.message)
}

export async function updateInventoryQty(id: string, quantity: number) {
  const admin = getAdmin()
  const { error } = await admin
    .from('inventory')
    .update({ quantity })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Payments ──────────────────────────────────────────────────────────────────
export async function createPayment(data: Record<string, any>) {
  const admin = getAdmin()
  const { error } = await admin.from('payments').insert(data)
  if (error) console.warn('Payment insert warn:', error.message)
}

// ── Activity log ──────────────────────────────────────────────────────────────
export async function logActivity(data: Record<string, any>) {
  try {
    const admin = getAdmin()
    await admin.from('activity_log').insert(data)
  } catch {}
}

// ── Email log ─────────────────────────────────────────────────────────────────
export async function logEmail(data: Record<string, any>) {
  try {
    const admin = getAdmin()
    await admin.from('email_log').insert(data)
  } catch {}
}

// ── Users/Profiles ────────────────────────────────────────────────────────────
export async function updateUserRole(userId: string, role: string) {
  const admin = getAdmin()
  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  if (error) throw new Error(error.message)
}

// ── Contact messages ─────────────────────────────────────────────────────────
export async function saveContactMessage(data: Record<string, any>) {
  const admin = getAdmin()
  const { error } = await admin.from('activity_log').insert({
    action: 'contact.message',
    entity_type: 'contact',
    ...data,
  })
  if (error) throw new Error(error.message)
}

// ── Transfer stock between branches ─────────────────────────────────────────
export async function transferStock(
  fromId: string, fromQty: number,
  toId: string, toQty: number
) {
  const admin = getAdmin()
  await Promise.all([
    admin.from('inventory').update({ quantity: fromQty }).eq('id', fromId),
    admin.from('inventory').update({ quantity: toQty }).eq('id', toId),
  ])
}
