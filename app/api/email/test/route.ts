import { NextResponse } from 'next/server'

// GET /api/email/test?to=your@email.com
// Tests the full email chain end-to-end
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const to = searchParams.get('to') ?? 'test@example.com'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const diagnostics: Record<string, any> = {
    supabaseUrl: supabaseUrl ? '✅ set' : '❌ MISSING',
    serviceKey: serviceKey ? '✅ set' : '❌ MISSING',
    edgeFunctionUrl: `${supabaseUrl}/functions/v1/send-email`,
  }

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing env vars', diagnostics })
  }

  // Test the edge function directly
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        to,
        subject: 'DBB Email Test',
        html: '<p>If you see this, email is working! 🌸</p>',
      }),
    })

    const body = await res.json().catch(() => res.text())
    diagnostics.edgeFunctionStatus = res.status
    diagnostics.edgeFunctionResponse = body
    diagnostics.success = res.ok

    return NextResponse.json(diagnostics)
  } catch (err: any) {
    diagnostics.error = err?.message
    return NextResponse.json(diagnostics)
  }
}
