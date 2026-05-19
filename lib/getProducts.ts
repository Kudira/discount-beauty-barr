import { createClient } from '@/lib/supabase/server'
import { sampleProducts } from '@/data/products'
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
      stock: stockMap && Object.keys(stockMap).length > 0 ? (stockMap[v.id] ?? 0) : (v.stock ?? 20),
      images: v.images ?? [],
    })),
    basePrice: row.base_price,
    isFeatured: row.is_featured,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

async function getStockMap(supabase: any): Promise<Record<string, number>> {
  try {
    const { data } = await supabase
      .from('inventory')
      .select('variant_id, quantity')
    if (!data) return {}
    // Sum stock across both branches per variant
    return data.reduce((acc: Record<string, number>, row: any) => {
      acc[row.variant_id] = (acc[row.variant_id] ?? 0) + row.quantity
      return acc
    }, {})
  } catch {
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
    if (!data || data.length === 0) return sampleProducts
    return data.map((p: any) => toProduct(p, stockMap))
  } catch {
    return sampleProducts
  }
}

export async function getProductBySlugFromDB(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient()
    const [{ data }, stockMap] = await Promise.all([
      supabase.from('products').select('*, product_variants(*)').eq('slug', slug).eq('is_active', true).single(),
      getStockMap(supabase),
    ])
    if (!data) return sampleProducts.find((p) => p.slug === slug) ?? null
    return toProduct(data, stockMap)
  } catch {
    return sampleProducts.find((p) => p.slug === slug) ?? null
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient()
    const [{ data }, stockMap] = await Promise.all([
      supabase.from('products').select('*, product_variants(*)').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(6),
      getStockMap(supabase),
    ])
    if (!data || data.length === 0) return sampleProducts.filter((p) => p.isFeatured)
    return data.map((p: any) => toProduct(p, stockMap))
  } catch {
    return sampleProducts.filter((p) => p.isFeatured)
  }
}

export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.from('products').select('slug').eq('is_active', true)
    const dbSlugs = (data ?? []).map((p: any) => p.slug)
    const localSlugs = sampleProducts.map((p) => p.slug)
    return [...new Set([...dbSlugs, ...localSlugs])]
  } catch {
    return sampleProducts.map((p) => p.slug)
  }
}
