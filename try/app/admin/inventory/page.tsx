import { createClient } from '@/lib/supabase/server'
import { InventoryClient } from './InventoryClient'

export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: inventory } = await supabase
    .from('inventory')
    .select(`
      id, quantity, low_stock_threshold, branch_id, updated_at,
      product_variants (
        id, name, sku, price,
        products ( id, name, brand, category, is_active )
      )
    `)
    .order('quantity', { ascending: true })

  return <InventoryClient inventory={(inventory ?? []) as any[]} />
}
