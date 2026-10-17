import { createAdminClient } from '@/lib/supabase/server'
import { BRANCHES } from '@/lib/constants'
import { InventoryClient } from './InventoryClient'

export const dynamic = 'force-dynamic'

// Supabase returns at most 1000 rows per request, so read in pages.
async function fetchAll(build: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: any }>) {
  const out: any[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build(from, from + 999)
    if (error) { console.error('[inventory page]', error.message); break }
    out.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return out
}

export default async function InventoryPage() {
  const supabase = createAdminClient() as any

  const [inventory, variants, branchRes] = await Promise.all([
    fetchAll((a, b) =>
      supabase.from('inventory').select('id, variant_id, branch_id, quantity, low_stock_threshold').order('id').range(a, b)
    ),
    fetchAll((a, b) =>
      supabase
        .from('product_variants')
        .select('id, name, sku, price, products ( id, name, brand, category, is_active )')
        .order('id')
        .range(a, b)
    ),
    supabase.from('branches').select('id, name, is_active').order('name'),
  ])

  const dbBranches = ((branchRes.data ?? []) as { id: string; name: string; is_active: boolean }[]).filter((b) => b.is_active)
  const branches = dbBranches.length > 0
    ? dbBranches.map((b) => ({ id: b.id, label: b.name.replace(/\s*branch$/i, '') }))
    : BRANCHES.map((b) => ({ id: b.id, label: b.name.replace(/\s*branch$/i, '') }))

  return <InventoryClient inventory={inventory} variants={variants} branches={branches} />
}
