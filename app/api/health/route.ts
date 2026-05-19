import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const checks: Record<string, any> = {}

  // Check env vars
  checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? '✅ ' + process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 40)
    : '❌ MISSING'

  checks.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? '✅ set (' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20) + '...)'
    : '❌ MISSING'

  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? '✅ set (' + process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 20) + '...)'
    : '❌ MISSING'

  checks.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL
    ? '✅ ' + process.env.NEXT_PUBLIC_APP_URL
    : '❌ MISSING'

  // Test Supabase connection with anon key
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await anon.from('products').select('id').limit(1)
    checks.supabase_anon_connection = error
      ? '❌ ' + error.message
      : '✅ Connected (' + (data?.length ?? 0) + ' products visible)'
  } catch (err: any) {
    checks.supabase_anon_connection = '❌ Exception: ' + err?.message
  }

  // Test Supabase connection with service role key
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data, error } = await admin.from('products').select('id').limit(1)
    checks.supabase_admin_connection = error
      ? '❌ ' + error.message
      : '✅ Connected (' + (data?.length ?? 0) + ' products visible)'
  } catch (err: any) {
    checks.supabase_admin_connection = '❌ Exception: ' + err?.message
  }

  // Test edge function reachability
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          to: 'test@test.com',
          subject: 'Health check',
          html: '<p>test</p>',
        }),
      }
    )
    checks.edge_function = res.ok
      ? '✅ Reachable (HTTP ' + res.status + ')'
      : '⚠️ HTTP ' + res.status + ': ' + (await res.text()).slice(0, 100)
  } catch (err: any) {
    checks.edge_function = '❌ ' + err?.message
  }

  return NextResponse.json(checks, { status: 200 })
}
