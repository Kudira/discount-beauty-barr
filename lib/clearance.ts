import { getServiceClient } from '@/lib/supabase/service'
import { categoryLabel } from '@/lib/constants'
import type { Product } from '@/types'

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

// ── Till (POS) support ───────────────────────────────────────────────────────
// While the sale is live the till sells the clearance products at their sale
// price and shares one stock count with the website (sale_item_availability
// counts both online orders and till sales tagged with the campaign).

/** The campaign, but only while it is enabled and inside its dates. */
export async function getLiveCampaign(): Promise<SaleCampaign | null> {
  const campaign = await getCampaign()
  if (!campaign || !campaign.isEnabled || windowFor(campaign) !== 'live') return null
  return campaign
}

/** Clearance products shaped for the POS product grid, at sale prices. */
export async function getPosClearanceProducts(): Promise<Product[]> {
  try {
    const campaign = await getLiveCampaign()
    if (!campaign) return []
    const db = getServiceClient()
    const [{ data: rows }, { data: avail }] = await Promise.all([
      db
        .from('sale_items')
        .select('variant_id, original_price, sale_price, sale_qty, sort_order, product_variants(id, name, sku, products(id, name, slug, description, category, brand, images, base_price, created_at))')
        .eq('campaign_id', campaign.id)
        .order('sort_order'),
      db.from('sale_item_availability').select('variant_id, remaining').eq('campaign_id', campaign.id),
    ])
    const left = new Map((avail ?? []).map((a: any) => [a.variant_id, Number(a.remaining)]))

    const out: Product[] = []
    for (const r of rows ?? []) {
      const v: any = Array.isArray((r as any).product_variants) ? (r as any).product_variants[0] : (r as any).product_variants
      const p: any = Array.isArray(v?.products) ? v.products[0] : v?.products
      if (!v || !p) continue
      const remaining = left.get((r as any).variant_id) ?? Number((r as any).sale_qty)
      out.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description ?? '',
        category: p.category,
        brand: p.brand ?? '',
        images: p.images ?? [],
        variants: [{ id: v.id, name: v.name, sku: v.sku, price: Number((r as any).sale_price), stock: remaining, images: [] }],
        basePrice: Number((r as any).sale_price),
        isFeatured: false,
        isActive: false,
        createdAt: p.created_at,
        clearance: { originalPrice: Number((r as any).original_price), remaining },
      })
    }
    return out
  } catch (err) {
    console.error('[clearance] could not load till products', err)
    return []
  }
}

type TillLine = { variant_id?: string; price?: number; quantity?: number; product_name?: string }

/**
 * Checks a till sale against the sale. Returns the campaign id to tag the
 * order with (when it holds clearance items), or an error message to show the
 * cashier. Never trusts the browser's prices or stock.
 */
export async function checkTillSale(lines: TillLine[]): Promise<{ campaignId: string | null; error?: string }> {
  const ids = lines.map((l) => l.variant_id).filter((x): x is string => !!x)
  if (ids.length === 0) return { campaignId: null }

  const campaign = await getCampaign()
  if (!campaign) return { campaignId: null }
  const db = getServiceClient()
  const { data: items } = await db
    .from('sale_items')
    .select('variant_id, sale_price')
    .eq('campaign_id', campaign.id)
    .in('variant_id', ids)
  if (!items || items.length === 0) return { campaignId: null }

  if (!campaign.isEnabled || windowFor(campaign) !== 'live') {
    return { campaignId: null, error: 'The clearance sale is not running, so clearance items cannot be sold. Refresh the till.' }
  }

  const { data: avail } = await db
    .from('sale_item_availability')
    .select('variant_id, remaining')
    .eq('campaign_id', campaign.id)
    .in('variant_id', ids)
  const price = new Map(items.map((i: any) => [i.variant_id, Number(i.sale_price)]))
  const left = new Map((avail ?? []).map((a: any) => [a.variant_id, Number(a.remaining)]))

  const wanted = new Map<string, number>()
  for (const l of lines) {
    if (!l.variant_id || !price.has(l.variant_id)) continue
    const label = l.product_name ?? 'A clearance item'
    if (Math.round(Number(l.price) * 100) !== Math.round(price.get(l.variant_id)! * 100)) {
      return { campaignId: null, error: `${label} is not at its clearance price. Refresh the till and add it again.` }
    }
    wanted.set(l.variant_id, (wanted.get(l.variant_id) ?? 0) + Number(l.quantity ?? 0))
  }
  for (const [variantId, qty] of wanted) {
    const remaining = left.get(variantId) ?? 0
    if (qty > remaining) {
      const name = lines.find((l) => l.variant_id === variantId)?.product_name ?? 'A clearance item'
      return { campaignId: null, error: `Only ${remaining} of ${name} left in the clearance sale. Reduce the quantity.` }
    }
  }
  return { campaignId: campaign.id }
}
