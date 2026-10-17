import { NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { sendEmailServer } from '@/lib/email/sendEmailServer'

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Contact form messages are saved from the server (the database no longer
// accepts inserts straight from a visitor's browser).
export async function POST(request: Request) {
  const ip = clientIp(request)
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'Too many messages. Please try again in a few minutes.' }, { status: 429 })
  }
  const b = await request.json().catch(() => null)
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
  const name = str(b?.name, 120), email = str(b?.email, 200), message = str(b?.message, 4000)
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message) {
    return NextResponse.json({ error: 'Please fill in your name, a valid email and a message.' }, { status: 400 })
  }
  const { error } = await getServiceClient().from('activity_log').insert({
    action: 'contact.message',
    entity_type: 'contact',
    user_email: email,
    details: { name, phone: str(b?.phone, 40) || null, subject: str(b?.subject, 200), message },
  })
  if (error) return NextResponse.json({ error: 'Could not send your message. Please try again.' }, { status: 500 })
  // Tell the shop by email. Failures here never lose the message (it is saved above).
  try {
    const subject = str(b?.subject, 200)
    await sendEmailServer({
      to: 'hello@discountbeautybarr.com',
      subject: `New Contact Form: ${subject || 'Message'}`.replace(/[\r\n]+/g, ' '),
      html: `<h2>New message from ${esc(name)}</h2><p><strong>Email:</strong> ${esc(email)}</p>${str(b?.phone, 40) ? `<p><strong>Phone:</strong> ${esc(str(b?.phone, 40))}</p>` : ''}<p><strong>Subject:</strong> ${esc(subject)}</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
      template: 'contact',
    } as any)
  } catch {}
  return NextResponse.json({ success: true })
}
