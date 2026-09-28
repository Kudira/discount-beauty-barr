import { NextResponse } from 'next/server'
import { isValidWebhookSignature } from '@/lib/paystack'
import { confirmOnlinePayment } from '@/lib/payments/confirm-online'

// Paystack → our server. Set this URL in Paystack: Settings → API Keys & Webhooks.
// Catches payments where the customer closed the browser before the redirect.
export async function POST(request: Request) {
  const raw = await request.text()
  if (!isValidWebhookSignature(raw, request.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  try {
    const event = JSON.parse(raw)
    const reference: string | undefined = event?.data?.reference
    // POS MoMo sales are confirmed by the till itself.
    if (event?.event === 'charge.success' && reference && !reference.startsWith('POSMOMO-')) {
      await confirmOnlinePayment(reference)
    }
  } catch (err) {
    console.error('[paystack webhook]', err)
    // Still 200: Paystack retries on non-2xx, and verify/callback will catch up.
  }
  return NextResponse.json({ received: true })
}
