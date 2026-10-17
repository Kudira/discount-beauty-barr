import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { Product } from '@/types'

function toProduct(row: any, stockMap?: Record<string, number>): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    category: row.category,
    brand: row.brand,
    images: row.images ?? [],
    variants: (row.product_variants ?? []).map((v: any) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      stock: stockMap?.[v.id] ?? 0,
      images: v.images ?? [],
    })),
    basePrice: row.base_price,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

// Inventory is RLS-protected (staff only), so read stock with the service-role
// client on the server. Falls back to the session client if the key is missing.
async function getStockMap(supabase: any): Promise<Record<string, number>> {
  try {
    let reader = supabase
    try { if (process.env.SUPABASE_SERVICE_ROLE_KEY) reader = createAdminClient() } catch {}
    // Supabase returns at most 1000 rows per request, so read in pages.
    const rows: any[] = []
    for (let from = 0; ; from += 1000) {
      const { data, error } = await reader
        .from('inventory')
        .select('variant_id, quantity')
        .order('id')
        .range(from, from + 999)
      if (error) { console.error('[getStockMap]', error.message); break }
      rows.push(...(data ?? []))
      if (!data || data.length < 1000) break
    }
    // Sum stock across all branches per variant. A negative total (sold before
    // it was recorded) shows as 0 to customers and at the till.
    const sums = rows.reduce((acc: Record<string, number>, row: any) => {
      acc[row.variant_id] = (acc[row.variant_id] ?? 0) + row.quantity
      return acc
    }, {})
    for (const k of Object.keys(sums)) sums[k] = Math.max(sums[k], 0)
    return sums
  } catch (err) {
    console.error('[getStockMap] failed', err)
    return {}
  }
}

export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const [{ data }, stockMap] = await Promise.all([
      supabase.from('products').select('*, product_variants(*)').eq('is_active', true).order('created_at', { ascending: false }),
      getStockMap(supabase),
    ])
    if (!data) return []
    return data.map((p: any) => toProduct(p, stockMap))
  } catch {
    return []
  }
}

export async function getProductBySlugFromDB(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient()
    const [{ data }, stockMap] = await Promise.all([
      supabase.from('products').select('*, product_variants(*)').eq('slug', slug).eq('is_active', true).single(),
      getStockMap(supabase),
    ])
    if (!data) return null
    return toProduct(data, stockMap)
  } catch {
    return null
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const [{ data }, stockMap] = await Promise.all([
      supabase.from('products').select('*, product_variants(*)').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(6),
      getStockMap(supabase),
    ])
    if (!data) return []
    return data.map((p: any) => toProduct(p, stockMap))
  } catch {
    return []
  }
}

export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('products').select('slug').eq('is_active', true)
    return (data ?? []).map((p: any) => p.slug)
  } catch {
    return []
  }
}
