import { getServiceClient } from '@/lib/supabase/service'
import { categoryLabel } from '@/lib/constants'

// Server-only helpers for the clearance sale. Everything here runs with the
// service-role client; none of the sale tables are readable with the public key.

export const CLEARANCE_SLUG = 'october-clearance'
export const PENDING_HOLD_MINUTES = 30

export type SaleItem = {
  variantId: string
  name: string
  brand: string
  category: string
  categoryLabel: string
  description: string
  variant: string
  image: string | null
  original: number
  price: number
  remaining: number
  total: number
  sort: number
}

export type SaleWindow = 'upcoming' | 'live' | 'ended'

export type SaleCampaign = {
  id: string
  slug: string
  name: string
  startsAt: string
  endsAt: string
  isEnabled: boolean
  previewKey: string
}

export type SaleState = {
  campaign: SaleCampaign
  window: SaleWindow
  /** True when the visitor holds the preview key and the sale is not live. */
  preview: boolean
  /** Items are only sent to the browser when the sale is live or previewed. */
  items: SaleItem[]
}

export function windowFor(campaign: Pick<SaleCampaign, 'startsAt' | 'endsAt'>, now = Date.now()): SaleWindow {
  if (now < new Date(campaign.startsAt).getTime()) return 'upcoming'
  if (now > new Date(campaign.endsAt).getTime()) return 'ended'
  return 'live'
}

export async function getCampaign(slug = CLEARANCE_SLUG): Promise<SaleCampaign | null> {
  const db = getServiceClient()
  const { data } = await db
    .from('sale_campaigns')
    .select('id, slug, name, starts_at, ends_at, is_enabled, preview_key')
    .eq('slug', slug)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    isEnabled: data.is_enabled,
    previewKey: data.preview_key,
  }
}

export async function getSaleItems(campaignId: string): Promise<SaleItem[]> {
  const db = getServiceClient()
  const [{ data: rows }, { data: avail }] = await Promise.all([
    db
      .from('sale_items')
      .select('variant_id, original_price, sale_price, sale_qty, sort_order, product_variants(name, products(name, brand, category, description, images, is_active))')
      .eq('campaign_id', campaignId)
      .order('sort_order'),
    db.from('sale_item_availability').select('variant_id, remaining').eq('campaign_id', campaignId),
  ])
  const left = new Map((avail ?? []).map((a: any) => [a.variant_id, Number(a.remaining)]))

  return (rows ?? []).map((r: any) => {
    const v = Array.isArray(r.product_variants) ? r.product_variants[0] : r.product_variants
    const p = Array.isArray(v?.products) ? v.products[0] : v?.products
    return {
      variantId: r.variant_id,
      name: p?.name ?? '',
      brand: p?.brand ?? '',
      category: p?.category ?? '',
      categoryLabel: categoryLabel(p?.category ?? ''),
      description: p?.description ?? '',
      variant: v?.name ?? '',
      image: Array.isArray(p?.images) && p.images.length ? p.images[0] : null,
      original: Number(r.original_price),
      price: Number(r.sale_price),
      remaining: left.get(r.variant_id) ?? Number(r.sale_qty),
      total: Number(r.sale_qty),
      sort: r.sort_order,
    } as SaleItem
  })
}

/**
 * Decides what a visitor may see. `key` is the preview key from the link, which
 * lets the owner look at the page before the sale opens.
 */
export async function getSaleState(key?: string | null): Promise<SaleState | null> {
  const campaign = await getCampaign()
  if (!campaign || !campaign.isEnabled) return null
  const window = windowFor(campaign)
  const keyOk = !!key && key === campaign.previewKey
  const preview = keyOk && window !== 'live'
  const items = window === 'live' || keyOk ? await getSaleItems(campaign.id) : []
  return { campaign: { ...campaign, previewKey: '' }, window, preview, items }
}