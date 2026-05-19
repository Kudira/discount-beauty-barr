import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { slugify } from '@/lib/utils'

function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { productId, product, variants } = body
    const admin = getAdmin()

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
      if (v.isNew && v.name && v.sku && v.price) {
        const { data: newVar, error: varErr } = await admin
          .from('product_variants')
          .insert({ product_id: productId, name: v.name, sku: v.sku, price: Number(v.price), images: cleanImgs })
          .select('id')
          .single()

        if (!varErr && newVar?.id) {
          await admin.from('inventory').insert([
            { variant_id: newVar.id, branch_id: 'osu', quantity: 0, low_stock_threshold: 5 },
            { variant_id: newVar.id, branch_id: 'east-legon', quantity: 0, low_stock_threshold: 5 },
          ])
        }
      } else if (!v.isNew && v.id) {
        await admin
          .from('product_variants')
          .update({ name: v.name, sku: v.sku, price: Number(v.price), images: cleanImgs })
          .eq('id', v.id)
      }
    }

    // Log activity
    await admin.from('activity_log').insert({
      action: 'product.updated',
      entity_type: 'product',
      entity_id: productId,
      details: { name: product.name },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
