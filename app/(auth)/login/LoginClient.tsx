'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LoginClient() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('next') ?? searchParams.get('redirect') ?? '/'
  const safeRedirect = redirectTo.startsWith('/login') || redirectTo.startsWith('/register') ? '/' : redirectTo
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsConfirmation(false)

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      const msg = signInError.message.toLowerCase()
      if (msg.includes('email not confirmed')) {
        setNeedsConfirmation(true)
      } else if (msg.includes('invalid login credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.includes('too many requests')) {
        setError('Too many attempts. Please wait a few minutes.')
      } else {
        setError(signInError.message)
      }
      setLoading(false)
      return
    }

    // Signed in — show redirecting state then navigate
    setLoading(false)
    setRedirecting(true)
    window.location.href = safeRedirect
  }

  const handleResend = async () => {
    setResendLoading(true)
    await supabase.auth.resend({ type: 'signup', email })
    setResendSent(true)
    setResendLoading(false)
  }

  const isBusy = loading || redirecting

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

  // Full-screen redirecting overlay — user sees this during navigation
  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: '#FAF7F4' }}>
        <Loader2 size={28} color="#B76E79" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>
          Signing you in…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FAF7F4' }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '28px', color: '#2C2420', letterSpacing: '0.04em' }}>
              Discount Beauty Barr<span style={{ color: '#B76E79' }}>.</span>
            </h1>
          </Link>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74', marginTop: '6px' }}>
            Sign in to your account
          </p>
        </div>

        <div className="p-8" style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '2px' }}>

          {needsConfirmation && (
            <div className="mb-6 p-4 flex flex-col gap-2"
              style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '4px' }}>
              <div className="flex items-start gap-2">
                <Mail size={15} color="#92400E" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#92400E', lineHeight: 1.6 }}>
                  Please confirm your email before signing in. Check your inbox for a confirmation link.
                </p>
              </div>
              {resendSent
                ? <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#16A34A', paddingLeft: '22px' }}>✓ Confirmation email resent.</p>
                : <button onClick={handleResend} disabled={resendLoading}
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#B76E79', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: '22px', textAlign: 'left' }}>
                    {resendLoading ? 'Sending…' : 'Resend confirmation email →'}
                  </button>
              }
            </div>
          )}

          {error && (
            <div className="mb-6 p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#DC2626' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label style={labelStyle}>Email Address</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" style={inputStyle} disabled={isBusy}
                onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <label style={labelStyle}>Password</label>
                <Link href="/forgot-password"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#B76E79', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input required type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password" style={{ ...inputStyle, paddingRight: '44px' }}
                  disabled={isBusy}
                  onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                  onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8C7B74' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isBusy}
              className="flex items-center justify-center gap-2"
              style={{ width: '100%', padding: '13px', background: isBusy ? '#8C7B74' : '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '17px', letterSpacing: '0.06em', border: 'none', cursor: isBusy ? 'not-allowed' : 'pointer', borderRadius: '2px', marginTop: '4px', transition: 'background 0.2s' }}>
              {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" style={{ color: '#B76E79', textDecoration: 'none', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", fontSize: '15px' }}>
                Create one
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center mt-6" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#C4B8B2', lineHeight: 1.6 }}>
          New account? Check your email inbox after signing up<br />and click the confirmation link to activate.
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
