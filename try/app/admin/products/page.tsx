import { createClient } from '@/lib/supabase/server'
import { AdminProductsClient } from './AdminProductsClient'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, product_variants(id, name, price, sku)')
    .order('created_at', { ascending: false })

  return <AdminProductsClient products={(data ?? []) as any[]} />
}
