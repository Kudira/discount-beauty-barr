import { NextResponse } from 'next/server'
import { getPosSession } from '@/lib/pos/session'
import { verifyTransaction } from '@/lib/paystack'

// Polled by the till while the customer approves the prompt on their phone.
export async function GET(request: Request) {
  const session = await getPosSession()
  if (!session) return NextResponse.json({ error: 'Sign in with your PIN first.' }, { status: 401 })

  const reference = new URL(request.url).searchParams.get('reference') ?? ''
  if (!reference.startsWith('POSMOMO-')) {
    return NextResponse.json({ error: 'Missing payment reference.' }, { status: 400 })
  }

  try {
    const result = await verifyTransaction(reference)
    if (!result.status || !result.data) {
      // Paystack may not have the transaction on record for a few seconds.
      return NextResponse.json({ status: 'pending' })
    }
    return NextResponse.json({
      status: result.data.status,
      message: result.data.gateway_response ?? null,
      amount: result.data.amount / 100,
    })
  } catch (err: any) {
    console.error('[POS momo status]', err)
    return NextResponse.json({ status: 'pending' })
  }
}
