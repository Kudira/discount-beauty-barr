// Email sender — calls /api/email which uses service role key server-side
// This is a plain async function (NOT a server action) so it works from any component

interface EmailPayload {
  to: string
  subject: string
  html: string
  orderId?: string
  template?: string
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    const response = await fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      console.warn('[Email] API error:', data.error)
      return false
    }
    return true
  } catch (err: any) {
    console.warn('[Email] Failed to reach /api/email:', err?.message)
    return false
  }
}
