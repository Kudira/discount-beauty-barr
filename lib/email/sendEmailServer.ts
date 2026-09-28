import { getServiceClient } from '@/lib/supabase/service'

// Server-side email sender (same path as /api/email, without the HTTP hop).
// Use from API routes; client components keep using sendEmail().
export async function sendEmailServer(payload: {
  to: string
  subject: string
  html: string
  orderId?: string
  template?: string
}): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false

  const db = getServiceClient()
  const { data: logRow } = await db.from('email_log').insert({
    to_email: payload.to,
    subject: payload.subject,
    template: payload.template ?? 'custom',
    status: 'pending',
    order_id: payload.orderId ?? null,
  }).select('id').single()

  let ok = false
  let errorMsg = ''
  try {
    const res = await fetch(`${url}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ to: payload.to, subject: payload.subject, html: payload.html }),
    })
    ok = res.ok
    if (!ok) errorMsg = (await res.text().catch(() => `HTTP ${res.status}`)).slice(0, 500)
  } catch (err: any) {
    errorMsg = err?.message ?? 'fetch failed'
  }

  if (logRow?.id) {
    await db.from('email_log').update({ status: ok ? 'sent' : 'failed', error: ok ? null : errorMsg }).eq('id', logRow.id)
  }
  return ok
}
