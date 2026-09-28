import { NextResponse } from 'next/server'
import { confirmOnlinePayment } from '@/lib/payments/confirm-online'

// Called by /checkout/verify after Paystack redirects the customer back.
export async function POST(request: Request) {
  const { reference } = await request.json().catch(() => ({}))
  if (typeof reference !== 'string' || !reference || reference.startsWith('POSMOMO-')) {
    return NextResponse.json({ state: 'failed', message: 'Missing payment reference.' }, { status: 400 })
  }
  try {
    return NextResponse.json(await confirmOnlinePayment(reference))
  } catch (err: any) {
    console.error('[paystack verify]', err)
    return NextResponse.json({ state: 'pending' })
  }
}
