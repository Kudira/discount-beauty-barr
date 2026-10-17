import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireManager, authErrorResponse } from '@/lib/auth/guards'

function admin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  try {
    const { data, error } = await admin().from('brands').select('id, name, sku_prefix').order('name')
    if (error) {
      // brands table may not exist yet — return empty list gracefully
      return NextResponse.json({ brands: [] })
    }
    return NextResponse.json({ brands: data ?? [] })
  } catch {
    return NextResponse.json({ brands: [] })
  }
}

export async function POST(request: Request) {
  try {
    await requireManager()
    const { name, sku_prefix } = await request.json()
    if (!name || !sku_prefix) return NextResponse.json({ error: 'Name and SKU prefix required' }, { status: 400 })
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const { data, error } = await admin()
      .from('brands').insert({ name, slug, sku_prefix: sku_prefix.toUpperCase().slice(0,4) }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ brand: data })
  } catch (err: any) {
    return authErrorResponse(err) ?? NextResponse.json({ error: err.message }, { status: 500 })
  }
}
