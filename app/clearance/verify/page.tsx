'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const MAX_CHECKS = 20 // about 60 seconds, mobile money can take a moment
const INTERVAL_MS = 3000
const STORAGE_KEY = 'dbb_clearance_cart'

type View = 'checking' | 'paid' | 'slow' | 'failed'

function VerifyContent() {
  const params = useSearchParams()
  const reference = params.get('reference') ?? params.get('trxref')
  const [view, setView] = useState<View>('checking')
  const [message, setMessage] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
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
          try { localStorage.removeItem(STORAGE_KEY) } catch {}
          setOrderNumber(json.orderNumber ?? '')
          setView('paid')
          return
        }
        if (json.state === 'failed') { setView('failed'); setMessage(json.message ?? 'The payment did not go through.'); return }
      } catch { /* retry */ }
      if (checks >= MAX_CHECKS) { setView('slow'); return }
      setTimeout(check, INTERVAL_MS)
    }
    check()
    return () => { cancelled = true }
  }, [reference])

  return (
    <div className="clr-wrap clr-verify">
      <div>
        {view === 'checking' && (
          <>
            <div className="clr-spin" />
            <h1>Confirming your payment</h1>
            <p>This usually takes a few seconds. If you paid with mobile money, approve the prompt on your phone.</p>
          </>
        )}
        {view === 'paid' && (
          <>
            <CheckCircle2 size={48} color="#2F7D57" style={{ margin: '0 auto 18px' }} />
            <h1>Order confirmed</h1>
            {orderNumber && <span className="clr-ordno">Order {orderNumber}</span>}
            <p style={{ marginTop: 18 }}>Thank you for shopping the clearance sale. A confirmation email is on its way, and we will message you when your order is ready.</p>
            <a className="clr-cta" href="/clearance">Back to the sale</a>
          </>
        )}
        {view === 'slow' && (
          <>
            <h1>Still waiting on your network</h1>
            <p>Your payment has not been confirmed yet. If money left your account you will get a confirmation email once it clears. You do not need to pay again.</p>
          </>
        )}
        {view === 'failed' && (
          <>
            <AlertCircle size={44} color="#C8232C" style={{ margin: '0 auto 18px' }} />
            <h1>Payment not completed</h1>
            <p>{message} Your bag is still saved, so you can try again.</p>
            <a className="clr-cta" href="/clearance">Back to the sale</a>
          </>
        )}
      </div>
    </div>
  )
}

export default function ClearanceVerifyPage() {
  return (
    <>
      <header className="clr-top">
        <div className="clr-wrap clr-top-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="clr-logo" src="/clearance/logo-light.png" alt="Discount Beauty Barr" width={103} height={44} />
        </div>
      </header>
      <Suspense fallback={<div className="clr-wrap clr-verify"><div className="clr-spin" /></div>}>
        <VerifyContent />
      </Suspense>
    </>
  )
}
