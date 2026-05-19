// Email sender — uses Resend via Supabase Edge Function
// Setup: Deploy the edge function in supabase/functions/send-email/
// Then add RESEND_API_KEY to Supabase secrets

import { createClient } from '@/lib/supabase/client'

interface EmailPayload {
  to: string
  subject: string
  html: string
  orderId?: string
  template?: string
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const supabase = createClient()

  try {
    // Log the attempt first
    const { data: logRow } = await (supabase as any).from('email_log').insert({
      to_email: payload.to,
      subject: payload.subject,
      template: payload.template ?? 'custom',
      status: 'pending',
      order_id: payload.orderId ?? null,
    }).select('id').single()

    // Try Edge Function — if not deployed, fail silently
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to: payload.to, subject: payload.subject, html: payload.html },
    })

    // Update log with result
    if (logRow?.id) {
      await (supabase as any).from('email_log').update({
        status: error ? 'failed' : 'sent',
        error: error ? String(error) : null,
      }).eq('id', logRow.id)
    }

    if (error) {
      // Edge Function not deployed yet — this is expected during development
      console.warn('[Email] Edge Function not available (deploy send-email to enable):', error.message)
      return false
    }

    return true
  } catch (err: any) {
    console.warn('[Email] sendEmail skipped:', err?.message)
    return false
  }
}

// Server-side version using fetch directly
export async function sendEmailServer(payload: EmailPayload): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceKey) return false

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    })

    return response.ok
  } catch {
    return false
  }
}
