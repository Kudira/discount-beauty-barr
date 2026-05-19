'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className="text-center py-4">
      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '26px', color: '#2C2420', marginBottom: '8px' }}>
        Reset Link Sent
      </h2>
      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', lineHeight: 1.7, marginBottom: '20px' }}>
        Check your email at <strong style={{ color: '#2C2420' }}>{email}</strong> for a password reset link.
      </p>
      <Link href="/login" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', color: '#B76E79' }}>
        Back to Sign In →
      </Link>
    </div>
  )

  return (
    <>
      <div className="text-center mb-8">
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420', marginBottom: '6px' }}>
          Forgot Password?
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74' }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {error && (
        <div className="mb-5 p-3 text-center" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '2px' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#DC2626' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label style={{ display: 'block', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#8C7B74', marginBottom: '6px' }}>
            Email Address
          </label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="ama@email.com"
            style={{ width: '100%', padding: '11px 14px', background: '#FAF7F4', border: '1px solid #D4C5B8', borderRadius: '2px', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#2C2420', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
            onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
        </div>
        <button type="submit" disabled={loading}
          style={{ padding: '13px', background: loading ? '#8C7B74' : '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', letterSpacing: '0.06em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '2px', width: '100%' }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #E8DDD4' }}>
        <Link href="/login" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#B76E79', textDecoration: 'none' }}>
          ← Back to Sign In
        </Link>
      </div>
    </>
  )
}
