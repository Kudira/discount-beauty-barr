'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const MAX_CHECKS = 20 // ~60 seconds — mobile money can take a moment
const INTERVAL_MS = 3000

type View = 'checking' | 'slow' | 'failed'

function VerifyContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { clearCart } = useCart()
  const reference = params.get('reference') ?? params.get('trxref')
  const [view, setView] = useState<View>('checking')
  const [message, setMessage] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (!reference) { setView('failed'); setMessage('We could not find your payment reference.'); return }

    let checks = 0
    let cancelled = false
    const check = async () => {
      checks++
      try {
        const res = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        })
        const json = await res.json()
        if (cancelled) return
        if (json.state === 'paid') {
          clearCart()
          router.replace(`/checkout/success?order=${encodeURIComponent(json.orderNumber)}`)
          return
        }
        if (json.state === 'failed') { setView('failed'); setMessage(json.message ?? 'The payment did not go through.'); return }
      } catch { /* retry */ }
      if (checks >= MAX_CHECKS) { setView('slow'); return }
      setTimeout(check, INTERVAL_MS)
    }
    check()
    return () => { cancelled = true }
  }, [reference, clearCart, router])

  const heading = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 'clamp(28px, 4vw, 40px)', color: '#2C2420', lineHeight: 1.15 }
  const body = { fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '15px', color: '#8C7B74', lineHeight: 1.8, maxWidth: '420px', margin: '12px auto 28px' }
  const button = { padding: '13px 32px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', textDecoration: 'none', borderRadius: '2px', display: 'inline-block' }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
      {view === 'checking' && (
        <>
          <div style={{ width: '36px', height: '36px', margin: '0 auto 24px', border: '3px solid #F2EDE8', borderTopColor: '#B76E79', borderRadius: '50%', animation: 'verify-spin 0.8s linear infinite' }} />
          <h1 style={heading}>Confirming your payment</h1>
          <p style={body}>This usually takes a few seconds. If you paid with mobile money, approve the prompt on your phone.</p>
        </>
      )}
      {view === 'slow' && (
        <>
          <h1 style={heading}>Still waiting on your network</h1>
          <p style={body}>
            Your payment hasn’t been confirmed yet. If money left your account, you’ll get a confirmation email once it clears — you don’t need to pay again.
          </p>
          <Link href="/account" style={button}>View my orders</Link>
        </>
      )}
      {view === 'failed' && (
        <>
          <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 20px' }} />
          <h1 style={heading}>Payment not completed</h1>
          <p style={body}>{message} Your cart is still saved, so you can try again.</p>
          <Link href="/checkout" style={button}>Back to checkout</Link>
        </>
      )}
      <style>{`@keyframes verify-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center">Loading…</div>}>
      <VerifyContent />
    </Suspense>
  )
}
