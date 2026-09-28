import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { POS_COOKIE, getPosSession, sessionCookieOptions } from '@/lib/pos/session'

export async function POST() {
  const session = await getPosSession()
  if (session) {
    await getServiceClient().from('activity_log').insert({
      user_id: session.staffId,
      user_role: session.role,
      action: 'pos.logout',
      entity_type: 'pos',
      details: { staff: session.name, branch: session.branchId ?? 'unassigned' },
    })
  }
  const res = NextResponse.json({ success: true })
  res.cookies.set(POS_COOKIE, '', { ...sessionCookieOptions, maxAge: 0 })
  return res
}
