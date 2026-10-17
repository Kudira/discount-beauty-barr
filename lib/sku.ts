import { getServiceClient } from '@/lib/supabase/service'

/** Brand prefix: the brand's saved sku_prefix, else its initials. */
export async function prefixForBrand(brand: string | null | undefined): Promise<string> {
  const name = (brand ?? '').trim()
  if (name) {
    const { data } = await getServiceClient()
      .from('brands')
      .select('sku_prefix')
      .ilike('name', name)
      .limit(1)
      .maybeSingle()
    if (data?.sku_prefix) return String(data.sku_prefix).toUpperCase()
  }
  const initials = name.split(/\s+/).map((w) => w[0] ?? '').join('').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  return initials.slice(0, 4) || 'SKU'
}

/**
 * The next SKUs in the shop's existing pattern: BRANDPREFIX-0645, -0646 ...
 * The number comes from one shared counter in the database, so two people
 * adding products at the same moment can never get the same SKU.
 */
export async function nextSkus(brand: string | null | undefined, count = 1): Promise<string[]> {
  const prefix = await prefixForBrand(brand)
  const { data, error } = await getServiceClient().rpc('next_skus', { p_prefix: prefix, p_count: count })
  if (error || !Array.isArray(data)) throw new Error(error?.message ?? 'Could not create SKU numbers.')
  return data as string[]
}
