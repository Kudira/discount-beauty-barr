import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// /api/admin/* is already gated by middleware (admin / manager / super admin).

function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function whoIsCalling() {
  try {
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    if (!user) return {}
    const { data: p } = await getAdmin().from('profiles').select('email, role').eq('id', user.id).maybeSingle()
    return { user_id: user.id, user_email: p?.email ?? user.email ?? null, user_role: p?.role ?? null }
  } catch {
    return {}
  }
}

const validQty = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 100000

async function branchExists(admin: ReturnType<typeof getAdmin>, id: unknown) {
  if (typeof id !== 'string' || !id) return false
  const { data } = await admin.from('branches').select('id').eq('id', id).maybeSingle()
  return !!data
}

// Set the stock of one variant at one branch. Creates the inventory row if that
// branch has none yet, so stock can be added at any branch.
export async function PATCH(request: Request) {
  try {
    const { variantId, branchId, quantity } = await request.json()
    if (typeof variantId !== 'string' || !variantId) return NextResponse.json({ error: 'Choose a product variant.' }, { status: 400 })
    if (!validQty(quantity)) return NextResponse.json({ error: 'Quantity must be a whole number, 0 or more.' }, { status: 400 })

    const admin = getAdmin()
    if (!(await branchExists(admin, branchId))) return NextResponse.json({ error: 'Choose a valid branch.' }, { status: 400 })

    const { data: variant } = await admin.from('product_variants').select('id, sku').eq('id', variantId).maybeSingle()
    if (!variant) return NextResponse.json({ error: 'That product variant no longer exists.' }, { status: 404 })

    const { data: existing } = await admin
      .from('inventory')
      .select('id, quantity')
      .eq('variant_id', variantId)
      .eq('branch_id', branchId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let inventoryId: string
    if (existing) {
      const { error } = await admin.from('inventory').update({ quantity }).eq('id', existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      inventoryId = existing.id
    } else {
      const { data: created, error } = await admin
        .from('inventory')
        .insert({ variant_id: variantId, branch_id: branchId, quantity, low_stock_threshold: 5 })
        .select('id')
        .single()
      if (error || !created) return NextResponse.json({ error: error?.message ?? 'Could not save.' }, { status: 400 })
      inventoryId = created.id
    }

    await admin.from('activity_log').insert({
      ...(await whoIsCalling()),
      action: 'inventory.adjusted',
      entity_type: 'inventory',
      entity_id: inventoryId,
      details: { sku: variant.sku, branch: branchId, from: existing?.quantity ?? null, to: quantity },
    })

    return NextResponse.json({ success: true, inventoryId, quantity })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Move stock from one branch to another. Quantities are read on the server, the
// source is only updated if nobody changed it in the meantime, and the move is
// written to stock_transfers.
export async function POST(request: Request) {
  try {
    const { variantId, fromBranch, toBranch, quantity, note } = await request.json()
    if (typeof variantId !== 'string' || !variantId) return NextResponse.json({ error: 'Choose a product variant.' }, { status: 400 })
    if (!Number.isInteger(quantity) || quantity < 1) return NextResponse.json({ error: 'Quantity must be at least 1.' }, { status: 400 })
    if (fromBranch === toBranch) return NextResponse.json({ error: 'Choose two different branches.' }, { status: 400 })

    const admin = getAdmin()
    if (!(await branchExists(admin, fromBranch)) || !(await branchExists(admin, toBranch))) {
      return NextResponse.json({ error: 'Choose valid branches.' }, { status: 400 })
    }

    const { data: from } = await admin.from('inventory').select('id, quantity').eq('variant_id', variantId).eq('branch_id', fromBranch).limit(1).maybeSingle()
    if (!from || from.quantity < quantity) {
      return NextResponse.json({ error: `Not enough stock at the source branch (${from?.quantity ?? 0} available).` }, { status: 409 })
    }
    const { data: to } = await admin.from('inventory').select('id, quantity').eq('variant_id', variantId).eq('branch_id', toBranch).limit(1).maybeSingle()

    const newFrom = from.quantity - quantity
    const { data: took, error: fromErr } = await admin
      .from('inventory')
      .update({ quantity: newFrom })
      .eq('id', from.id)
      .eq('quantity', from.quantity) // fails (0 rows) if someone changed it meanwhile
      .select('id')
    if (fromErr) return NextResponse.json({ error: fromErr.message }, { status: 400 })
    if (!took || took.length === 0) return NextResponse.json({ error: 'Stock changed while you were transferring. Refresh and try again.' }, { status: 409 })

    const newTo = (to?.quantity ?? 0) + quantity
    let toId = to?.id as string | undefined
    let toErr: { message: string } | null = null
    if (to) {
      const r = await admin.from('inventory').update({ quantity: newTo }).eq('id', to.id)
      toErr = r.error
    } else {
      const r = await admin.from('inventory').insert({ variant_id: variantId, branch_id: toBranch, quantity: newTo, low_stock_threshold: 5 }).select('id').single()
      toErr = r.error
      toId = r.data?.id
    }
    if (toErr) {
      // Put the stock back so nothing disappears.
      await admin.from('inventory').update({ quantity: from.quantity }).eq('id', from.id)
      return NextResponse.json({ error: toErr.message }, { status: 400 })
    }

    const who = await whoIsCalling()
    await admin.from('stock_transfers').insert({
      variant_id: variantId, from_branch: fromBranch, to_branch: toBranch, quantity,
      note: typeof note === 'string' && note.trim() ? note.trim() : null,
      created_by: who.user_id ?? null,
    })
    await admin.from('activity_log').insert({
      ...who,
      action: 'inventory.adjusted',
      entity_type: 'inventory',
      entity_id: variantId,
      details: { transfer: true, from_branch: fromBranch, to_branch: toBranch, quantity },
    })

    return NextResponse.json({
      success: true,
      from: { id: from.id, quantity: newFrom },
      to: { id: toId, quantity: newTo },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
