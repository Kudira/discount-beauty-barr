'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  background: 'white', border: '1px solid #D4C5B8', borderRadius: '2px',
  fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px',
  color: '#2C2420', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'Cormorant Garamond', serif",
  fontStyle: 'italic', fontSize: '13px', letterSpacing: '0.06em',
  color: '#8C7B74', marginBottom: '6px',
}

export function ContactForm() {
  const [state, setState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  })

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, subject: form.subject, message: form.message }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? 'Could not send your message.')
      }

      setState('success')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })

    } catch (err: any) {
      setErrorMsg('Something went wrong. Please try again or contact us directly.')
      setState('error')
    }
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#F2EDE8' }}>
          <CheckCircle className="w-7 h-7" style={{ color: '#B76E79' }} />
        </div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '26px', color: '#2C2420' }}>
          Message Received!
        </h3>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', maxWidth: '320px', lineHeight: 1.7 }}>
          Thank you for getting in touch. We&apos;ll get back to you as soon as possible — usually within 24 hours.
        </p>
        <button
          onClick={() => setState('idle')}
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#B76E79', background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px' }}>
          Send another message →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {state === 'error' && (
        <div className="flex items-start gap-3 p-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '2px' }}>
          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#DC2626' }}>{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label style={labelStyle}>Your Name *</label>
          <input required value={form.name} onChange={set('name')} placeholder="Ama Mensah" style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
            onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
        </div>
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="ama@email.com" style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
            onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+233 XX XXX XXXX" style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
            onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
        </div>
        <div>
          <label style={labelStyle}>Subject *</label>
          <select required value={form.subject} onChange={set('subject')}
            style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' as any }}
            onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
            onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')}>
            <option value="">Select a subject…</option>
            <option>Product Enquiry</option>
            <option>Order Support</option>
            <option>Returns & Exchanges</option>
            <option>Wholesale / Bulk Orders</option>
            <option>General Enquiry</option>
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Message *</label>
        <textarea required value={form.message} onChange={set('message')} rows={5}
          placeholder="How can we help you?"
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
          onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
      </div>

      <button type="submit" disabled={state === 'submitting'}
        style={{
          padding: '14px 32px', width: '100%',
          background: state === 'submitting' ? '#8C7B74' : '#2C2420',
          color: 'white', fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic', fontSize: '16px', letterSpacing: '0.06em',
          border: 'none', cursor: state === 'submitting' ? 'not-allowed' : 'pointer',
          borderRadius: '2px', transition: 'background 0.2s',
        }}>
        {state === 'submitting' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
