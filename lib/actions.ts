'use server'

import { getServiceClient } from '@/lib/supabase/service'
import { requireAdmin, requireManager } from '@/lib/auth/guards'
import { setOrderStatus } from '@/lib/orders-status'

// Every action here checks who is calling before it touches the database
// (the service-role client bypasses RLS, so the check has to happen here).

// ── Orders ──────────────────────────────────────────────────────────────────
export async function updateOrderStatus(orderId: string, status: string) {
  const caller = await requireManager()
  await setOrderStatus(orderId, status, caller)
}

// ── Products ─────────────────────────────────────────────────────────────────
export async function createProduct(data: Record<string, any>) {
  await requireManager()
  const { data: product, error } = await getServiceClient()
    .from('products')
    .insert(data)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return product
}

export async function updateProduct(id: string, data: Record<string, any>) {
  await requireManager()
  const { error } = await getServiceClient().from('products').update(data).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function createVariant(data: Record<string, any>) {
  await requireManager()
  const { data: variant, error } = await getServiceClient()
    .from('product_variants')
    .insert(data)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return variant
}

export async function updateVariant(id: string, data: Record<string, any>) {
  await requireManager()
  const { error } = await getServiceClient().from('product_variants').update(data).eq('id', id)
  if (error) throw new Error(error.message)
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export async function createInventoryRows(rows: Record<string, any>[]) {
  await requireManager()
  // upsert so an existing branch row is never duplicated or overwritten with 0
  const { error } = await getServiceClient()
    .from('inventory')
    .upsert(rows, { onConflict: 'variant_id,branch_id', ignoreDuplicates: true })
  if (error) console.warn('Inventory insert warn:', error.message)
}

// ── Activity log ──────────────────────────────────────────────────────────────
export async function logActivity(data: Record<string, any>) {
  try {
    const caller = await requireManager()
    await getServiceClient().from('activity_log').insert({
      action: String(data.action ?? 'unknown'),
      entity_type: data.entity_type ?? null,
      entity_id: data.entity_id ?? null,
      details: data.details ?? {},
      user_id: caller.id,
      user_email: caller.email,
      user_role: caller.role,
    })
  } catch {}
}

// ── Users/Profiles ────────────────────────────────────────────────────────────
const ROLES = ['super_admin', 'admin', 'manager', 'cashier', 'read_only', 'customer']

export async function updateUserRole(userId: string, role: string) {
  const caller = await requireAdmin()
  if (!ROLES.includes(role)) throw new Error('Unknown role.')
  if (userId === caller.id) throw new Error('You cannot change your own role.')

  const db = getServiceClient()
  const { data: target } = await db.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (!target) throw new Error('User not found.')

  const touchesSuper = role === 'super_admin' || target.role === 'super_admin'
  if (touchesSuper && caller.role !== 'super_admin') {
    throw new Error('Only a super admin can grant or remove super admin.')
  }

  const { error } = await db.from('profiles').update({ role }).eq('id', userId)
  if (error) throw new Error(error.message)
}
