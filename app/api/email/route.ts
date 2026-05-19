import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

function getAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, subject, html, orderId, template } = body

    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) {
      console.error('[Email] Missing SUPABASE env vars')
      return NextResponse.json({ success: false, error: 'Server misconfigured' }, { status: 500 })
    }

    // Log attempt
    const db = getAdmin()
    let logId: string | null = null
    try {
      const { data: logRow } = await db.from('email_log').insert({
        to_email: to,
        subject,
        template: template ?? 'custom',
        status: 'pending',
        order_id: orderId ?? null,
      }).select('id').single()
      logId = logRow?.id ?? null
    } catch {}

    // Call edge function with service role key
    let success = false
    let errorMsg = ''
    try {
      const edgeRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ to, subject, html }),
      })
      success = edgeRes.ok
      if (!success) {
        errorMsg = await edgeRes.text().catch(() => `HTTP ${edgeRes.status}`)
        console.warn('[Email] Edge function failed:', errorMsg.slice(0, 300))
      }
    } catch (fetchErr: any) {
      errorMsg = fetchErr?.message ?? 'fetch failed'
      console.error('[Email] Edge function unreachable:', errorMsg)
    }

    // Update log
    if (logId) {
      await db.from('email_log').update({
        status: success ? 'sent' : 'failed',
        error: success ? null : errorMsg.slice(0, 500),
      }).eq('id', logId).catch(() => {})
    }

    // Always return 200 so the checkout never fails due to email
    return NextResponse.json({ success, error: success ? null : errorMsg })

  } catch (err: any) {
    console.error('[Email API] Unexpected error:', err?.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 200 })
  }
}
