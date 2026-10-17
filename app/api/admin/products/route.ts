import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireManager, authErrorResponse } from '@/lib/auth/guards'
import { nextSkus } from '@/lib/sku'

function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(request: Request) {
  try {
    await requireManager()
    const body = await request.json()
    const { productId, product, variants } = body
    const admin = getAdmin()
    const warnings: string[] = []

    const { data: branchRows } = await admin.from('branches').select('id').eq('is_active', true)
    const branchIds: string[] = (branchRows ?? []).map((b: any) => b.id)

    // Update product
    const { error: productErr } = await admin
      .from('products')
      .update(product)
      .eq('id', productId)

    if (productErr) {
      return NextResponse.json({ error: productErr.message }, { status: 400 })
    }

    // Update/create variants
    for (const v of variants ?? []) {
      const cleanImgs = (v.images ?? []).filter(Boolean)
      if (v.isNew && v.name && v.price) {
        // No SKU typed? Make the next one in the shop's pattern automatically.
        const sku = (typeof v.sku === 'string' && v.sku.trim())
          ? v.sku.trim()
          : (await nextSkus(product?.brand, 1))[0]
        const { data: newVar, error: varErr } = await admin
          .from('product_variants')
          .insert({ product_id: productId, name: v.name, sku, price: Number(v.price), images: cleanImgs })
          .select('id')
          .single()

        if (varErr) {
          warnings.push(`Variant "${v.name}" was not added: ${varErr.message}`)
        } else if (newVar?.id) {
          await admin.from('inventory').upsert(
            branchIds.map((b) => ({ variant_id: newVar.id, branch_id: b, quantity: 0, low_stock_threshold: 5 })),
            { onConflict: 'variant_id,branch_id', ignoreDuplicates: true }
          )
        }
      } else if (!v.isNew && v.id) {
        const patch: Record<string, any> = { name: v.name, price: Number(v.price), images: cleanImgs }
        if (typeof v.sku === 'string' && v.sku.trim()) patch.sku = v.sku.trim()
        const { error: updErr } = await admin.from('product_variants').update(patch).eq('id', v.id)
        if (updErr) warnings.push(`Variant "${v.name}" was not saved: ${updErr.message}`)
      }
    }

    // Log activity
    await admin.from('activity_log').insert({
      action: 'product.updated',
      entity_type: 'product',
      entity_id: productId,
      details: { name: product.name },
    })

    return NextResponse.json({ success: true, warnings })
  } catch (err: any) {
    return authErrorResponse(err) ?? NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
