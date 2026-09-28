import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getPosSession } from '@/lib/pos/session'
import { getServiceClient } from '@/lib/supabase/service'
import { chargeMobileMoney, normaliseGhanaPhone } from '@/lib/paystack'
import { MOMO_PROVIDERS, type MomoProvider } from '@/lib/pos/momo-providers'

// Sends a mobile money payment prompt to the customer's phone.
export async function POST(request: Request) {
  const session = await getPosSession()
  if (!session) return NextResponse.json({ error: 'Sign in with your PIN first.' }, { status: 401 })

  const { amount, phone, provider, branchId } = await request.json().catch(() => ({}))
  const amt = Number(amount)
  if (!Number.isFinite(amt) || amt <= 0) {
    return NextResponse.json({ error: 'Amount must be more than zero.' }, { status: 400 })
  }
  if (!MOMO_PROVIDERS.some((p) => p.id === provider)) {
    return NextResponse.json({ error: 'Choose the customer’s network.' }, { status: 400 })
  }
  const localPhone = normaliseGhanaPhone(String(phone ?? ''))
  if (!localPhone) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Ghana number, e.g. 0241234567.' }, { status: 400 })
  }

  const reference = `POSMOMO-${Date.now()}-${randomBytes(3).toString('hex')}`

  try {
    const result = await chargeMobileMoney({
      email: 'pos@discountbeautybarr.com',
      amount: amt,
      phone: localPhone,
      provider: provider as MomoProvider,
      reference,
      metadata: {
        source: 'pos',
        branch: branchId ?? session.branchId,
        cashier_id: session.staffId,
        cashier: session.name,
      },
    })

    await getServiceClient().from('activity_log').insert({
      user_id: session.staffId,
      user_role: session.role,
      action: 'pos.momo_requested',
      entity_type: 'payment',
      entity_id: reference,
      details: {
        staff: session.name,
        amount: amt,
        network: provider,
        phone_last4: localPhone.slice(-4),
        paystack_status: result.data?.status ?? 'error',
      },
    })

    if (!result.status) {
      return NextResponse.json({ error: result.message || 'Paystack declined the request.' }, { status: 400 })
    }

    return NextResponse.json({
      reference: result.data.reference ?? reference,
      status: result.data.status,
      displayText: result.data.display_text ?? result.data.message ?? null,
    })
  } catch (err: any) {
    console.error('[POS momo charge]', err)
    return NextResponse.json({ error: 'Could not reach Paystack. Check the internet and try again.' }, { status: 502 })
  }
}
