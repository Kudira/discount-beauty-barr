import { getServiceClient } from '@/lib/supabase/service'

type Db = ReturnType<typeof getServiceClient>

export type StockLine = { variant_id: string | null; quantity: number }
export type Movement = { variantId: string; branchId: string; qty: number; after: number }

/**
 * Stock bookkeeping. A failure here must never block a sale, so every function
 * catches its own errors and returns what it managed to do.
 *
 * Quantities go through the change_stock() SQL function, which adds or removes
 * stock in a single atomic step and allows the result to be negative (an item
 * sold before its delivery was recorded).
 */

async function change(db: Db, variantId: string, branchId: string, delta: number): Promise<number | null> {
  const { data, error } = await db.rpc('change_stock', { p_variant: variantId, p_branch: branchId, p_delta: delta })
  if (error) {
    console.error('[stock] change_stock failed', variantId, branchId, delta, error.message)
    return null
  }
  return typeof data === 'number' ? data : null
}

function merge(lines: StockLine[]) {
  const m = new Map<string, number>()
  for (const l of lines) {
    if (!l.variant_id || !Number.isFinite(l.quantity) || l.quantity <= 0) continue
    m.set(l.variant_id, (m.get(l.variant_id) ?? 0) + Math.floor(l.quantity))
  }
  return m
}

async function record(db: Db, orderId: string, action: 'stock.deducted' | 'stock.restored', moves: Movement[]) {
  if (moves.length === 0) return
  await db.from('activity_log').insert({
    action,
    entity_type: 'order',
    entity_id: orderId,
    details: { moves },
  })
}

/** In-shop sale: take the items from the till's own branch. May go below zero. */
export async function deductAtBranch(orderId: string, branchId: string, lines: StockLine[]) {
  const db = getServiceClient()
  const moves: Movement[] = []
  for (const [variantId, qty] of merge(lines)) {
    const after = await change(db, variantId, branchId, -qty)
    if (after !== null) moves.push({ variantId, branchId, qty, after })
  }
  await record(db, orderId, 'stock.deducted', moves).catch(() => {})
  return { moves, negative: moves.filter((m) => m.after < 0) }
}

/**
 * Online order: take stock from the order's branch first (pickup), or from
 * whichever branches have the most (delivery), and let the last one go
 * negative if nothing has enough.
 */
export async function deductForOnlineOrder(orderId: string, preferredBranch: string | null, lines: StockLine[]) {
  const db = getServiceClient()
  const moves: Movement[] = []
  for (const [variantId, qty] of merge(lines)) {
    const { data: rows } = await db
      .from('inventory')
      .select('branch_id, quantity')
      .eq('variant_id', variantId)
    const have = new Map<string, number>((rows ?? []).map((r: any) => [r.branch_id, r.quantity]))
    const order = [...have.keys()].sort((a, b) => {
      if (a === preferredBranch) return -1
      if (b === preferredBranch) return 1
      return (have.get(b) ?? 0) - (have.get(a) ?? 0)
    })
    if (order.length === 0 && preferredBranch) order.push(preferredBranch)
    let left = qty
    for (let i = 0; i < order.length && left > 0; i++) {
      const branch = order[i]
      const avail = Math.max(have.get(branch) ?? 0, 0)
      const isLast = i === order.length - 1
      const take = isLast ? left : Math.min(left, avail)
      if (take <= 0) continue
      const after = await change(db, variantId, branch, -take)
      if (after !== null) moves.push({ variantId, branchId: branch, qty: take, after })
      left -= take
    }
  }
  await record(db, orderId, 'stock.deducted', moves).catch(() => {})
  return { moves, negative: moves.filter((m) => m.after < 0) }
}

/** Put the stock back for an order that was cancelled or refunded. Runs once. */
export async function restoreForOrder(orderId: string) {
  const db = getServiceClient()
  const { data: logs } = await db
    .from('activity_log')
    .select('action, details')
    .eq('entity_type', 'order')
    .eq('entity_id', orderId)
    .in('action', ['stock.deducted', 'stock.restored'])
  if (!logs || logs.some((l: any) => l.action === 'stock.restored')) return { restored: 0 }

  const moves: Movement[] = []
  for (const log of logs.filter((l: any) => l.action === 'stock.deducted')) {
    for (const m of (log.details?.moves ?? []) as Movement[]) {
      const after = await change(db, m.variantId, m.branchId, m.qty)
      if (after !== null) moves.push({ ...m, after })
    }
  }
  await record(db, orderId, 'stock.restored', moves).catch(() => {})
  return { restored: moves.length }
}

/** True if stock has already been taken for this order. */
export async function alreadyDeducted(orderId: string) {
  const db = getServiceClient()
  const { data } = await db
    .from('activity_log')
    .select('id')
    .eq('entity_type', 'order')
    .eq('entity_id', orderId)
    .eq('action', 'stock.deducted')
    .limit(1)
  return !!data && data.length > 0
}
