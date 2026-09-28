import { NextResponse } from 'next/server'
import { getPosSession } from '@/lib/pos/session'
import { submitOtp } from '@/lib/paystack'

// Some numbers get a one-time code instead of (or before) the phone prompt.
export async function POST(request: Request) {
  const session = await getPosSession()
  if (!session) return NextResponse.json({ error: 'Sign in with your PIN first.' }, { status: 401 })

  const { reference, otp } = await request.json().catch(() => ({}))
  if (typeof reference !== 'string' || !reference.startsWith('POSMOMO-')) {
    return NextResponse.json({ error: 'Missing payment reference.' }, { status: 400 })
  }
  if (typeof otp !== 'string' || !/^\d{4,8}$/.test(otp.trim())) {
    return NextResponse.json({ error: 'Enter the code the customer received.' }, { status: 400 })
  }

  try {
    const result = await submitOtp(reference, otp.trim())
    if (!result.status) {
      return NextResponse.json({ error: result.message || 'The code was not accepted.' }, { status: 400 })
    }
    return NextResponse.json({
      status: result.data.status,
      displayText: result.data.display_text ?? result.data.message ?? null,
    })
  } catch (err: any) {
    console.error('[POS momo otp]', err)
    return NextResponse.json({ error: 'Could not reach Paystack. Try again.' }, { status: 502 })
  }
}
