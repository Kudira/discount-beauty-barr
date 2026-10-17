import { NextResponse } from 'next/server'
import { requireManager, authErrorResponse } from '@/lib/auth/guards'
import { setOrderStatus } from '@/lib/orders-status'

export async function PATCH(request: Request) {
  try {
    const caller = await requireManager()
    const { orderId, status } = await request.json()
    if (typeof orderId !== 'string' || typeof status !== 'string') {
      return NextResponse.json({ error: 'Missing order or status.' }, { status: 400 })
    }
    await setOrderStatus(orderId, status, caller)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return authErrorResponse(err) ?? NextResponse.json({ error: err.message }, { status: 400 })
  }
}
