'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Mail, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function RegisterClient() {
  const supabase = createClient()

  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', background: 'white',
    border: '1px solid #D4C5B8', borderRadius: '2px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px',
    color: '#2C2420', outline: 'none', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic', fontSize: '13px', letterSpacing: '0.06em',
    color: '#8C7B74', marginBottom: '6px',
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FAF7F4' }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: '#F0FDF4' }}>
            <Mail className="w-9 h-9" style={{ color: '#16A34A' }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420', marginBottom: '12px' }}>
            Check your email!
          </h2>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '15px', color: '#8C7B74', lineHeight: 1.8, marginBottom: '8px' }}>
            We&apos;ve sent a confirmation link to <strong style={{ color: '#2C2420' }}>{form.email}</strong>
          </p>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', lineHeight: 1.7, marginBottom: '32px' }}>
            Click the link in the email to activate your account, then come back to sign in.
          </p>

          <div className="flex flex-col gap-3 items-center">
            {[
              'Check your inbox (and spam folder)',
              'Click the confirmation link',
              'Sign in with your new account',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle size={15} style={{ color: '#B76E79', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74' }}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          <Link href="/login"
            style={{ display: 'inline-block', marginTop: '32px', padding: '12px 32px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', textDecoration: 'none', borderRadius: '2px' }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#FAF7F4' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '28px', color: '#2C2420', letterSpacing: '0.04em' }}>
              Discount Beauty Barr<span style={{ color: '#B76E79' }}>.</span>
            </h1>
          </Link>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74', marginTop: '6px' }}>
            Create your account
          </p>
        </div>

        <div className="p-8" style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
          {error && (
            <div className="mb-5 p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#DC2626' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label style={labelStyle}>Full Name</label>
              <input required value={form.fullName} onChange={set('fullName')} placeholder="Ama Mensah"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input required type="email" value={form.email} onChange={set('email')} placeholder="your@email.com"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div className="relative">
                <input required type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder="At least 8 characters"
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                  onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8C7B74' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input required type="password" value={form.confirm} onChange={set('confirm')}
                placeholder="Repeat your password"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: loading ? '#8C7B74' : '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '17px', letterSpacing: '0.06em', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '2px', marginTop: '4px', transition: 'background 0.2s' }}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#B76E79', textDecoration: 'none', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", fontSize: '15px' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
