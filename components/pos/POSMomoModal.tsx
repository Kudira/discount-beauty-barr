'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Smartphone, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MOMO_LABELS, type MomoProvider } from '@/lib/pos/momo-providers'

type Stage = 'sending' | 'waiting' | 'otp' | 'paid' | 'failed'

const POLL_MS = 4000
const TIMEOUT_MS = 185_000 // networks cancel unapproved prompts after ~180s
const DONE_FAILED = ['failed', 'reversed'] // 'abandoned' = not approved yet; the timeout handles it

interface Props {
  amount: number
  phone: string
  provider: MomoProvider
  branchId: string
  onPaid: (reference: string) => void
  onClose: () => void
}

export function POSMomoModal({ amount, phone, provider, branchId, onPaid, onClose }: Props) {
  const [stage, setStage] = useState<Stage>('sending')
  const [reference, setReference] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const startedAt = useRef(0)
  const startedCharge = useRef(false)
  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid

  const fail = (msg: string) => { setStage('failed'); setMessage(msg) }

  const handleChargeResult = useCallback((status: string, displayText: string | null) => {
    if (status === 'success') { setStage('paid'); return }
    if (status === 'send_otp') { setStage('otp'); setMessage(displayText ?? 'Ask the customer for the code sent to their phone.'); return }
    if (DONE_FAILED.includes(status)) { fail(displayText ?? 'The payment was declined.'); return }
    setStage('waiting')
    setMessage(displayText ?? 'Ask the customer to approve the prompt on their phone.')
  }, [])

  const startCharge = useCallback(async () => {
    setStage('sending'); setMessage(''); setOtp('')
    startedAt.current = Date.now()
    try {
      const res = await fetch('/api/pos/momo/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, phone, provider, branchId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { fail(json.error ?? 'Could not send the payment prompt.'); return }
      setReference(json.reference)
      setTestMode(Boolean(json.testMode))
      handleChargeResult(json.status, json.displayText)
    } catch {
      fail('No connection. Check the internet and try again.')
    }
  }, [amount, phone, provider, branchId, handleChargeResult])

  // Send the prompt once when the modal opens
  useEffect(() => {
    if (startedCharge.current) return
    startedCharge.current = true
    startCharge()
  }, [startCharge])

  // Poll Paystack while waiting for the customer
  useEffect(() => {
    if (stage !== 'waiting' || !reference) return
    const timer = setInterval(async () => {
      if (Date.now() - startedAt.current > TIMEOUT_MS) {
        clearInterval(timer)
        fail('The customer did not approve in time. You can send the prompt again.')
        return
      }
      try {
        const res = await fetch(`/api/pos/momo/status?reference=${encodeURIComponent(reference)}`)
        const json = await res.json()
        if (json.status === 'success') { clearInterval(timer); setStage('paid') }
        else if (DONE_FAILED.includes(json.status)) {
          clearInterval(timer)
          fail(json.message ? `Declined: ${json.message}` : 'The payment was declined.')
        }
      } catch { /* keep polling */ }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [stage, reference])

  // Hand off to the sale once paid (short pause so the cashier sees the tick)
  useEffect(() => {
    if (stage !== 'paid' || !reference) return
    const t = setTimeout(() => onPaidRef.current(reference), 900)
    return () => clearTimeout(t)
  }, [stage, reference])

  const submitOtp = async () => {
    if (!reference || !otp.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/pos/momo/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, otp }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setMessage(json.error ?? 'The code was not accepted.'); return }
      setOtp('')
      handleChargeResult(json.status, json.displayText)
    } finally {
      setBusy(false)
    }
  }

  const canClose = stage !== 'paid'
  const font = "'Jost', sans-serif"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(44,36,32,0.7)' }}>
      <div className="w-full max-w-sm" style={{ background: 'white', borderRadius: '10px', overflow: 'hidden' }}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#2C2420' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(183,110,121,0.3)' }}>
            <Smartphone size={18} color="#E8B4A0" />
          </div>
          <div className="flex-1">
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', color: 'white' }}>Mobile Money</p>
            <p style={{ fontFamily: font, fontWeight: 300, fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
              {MOMO_LABELS[provider]} · {phone}
            </p>
          </div>
          {canClose && (
            <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="text-center py-3" style={{ background: '#FAF7F4', borderRadius: '6px', border: '1px solid #E8DDD4' }}>
            <p style={{ fontFamily: font, fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>Amount</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', color: '#2C2420', lineHeight: 1.1 }}>{formatCurrency(amount)}</p>
          </div>

          {testMode && stage !== 'paid' && (
            <p style={{ fontFamily: font, fontWeight: 300, fontSize: '11px', color: '#92400E', background: '#FEF3C7', borderRadius: '6px', padding: '8px 10px', lineHeight: 1.5 }}>
              Test mode: no real prompt is sent to the phone. Use Paystack’s test mobile money number to try this.
            </p>
          )}

          {(stage === 'sending' || stage === 'waiting') && (
            <div className="flex flex-col items-center gap-3 py-2">
              <div style={{ width: '28px', height: '28px', border: '3px solid #F2EDE8', borderTopColor: '#B76E79', borderRadius: '50%', animation: 'momo-spin 0.8s linear infinite' }} />
              <p style={{ fontFamily: font, fontSize: '14px', color: '#2C2420', textAlign: 'center' }}>
                {stage === 'sending' ? 'Sending payment prompt…' : 'Waiting for the customer to approve'}
              </p>
              {message && (
                <p style={{ fontFamily: font, fontWeight: 300, fontSize: '12px', color: '#8C7B74', textAlign: 'center', lineHeight: 1.5 }}>{message}</p>
              )}
            </div>
          )}

          {stage === 'otp' && (
            <div className="flex flex-col gap-2">
              <p style={{ fontFamily: font, fontSize: '13px', color: '#2C2420', lineHeight: 1.5 }}>{message}</p>
              <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} inputMode="numeric" autoFocus
                placeholder="Code" maxLength={8}
                onKeyDown={(e) => { if (e.key === 'Enter') submitOtp() }}
                style={{ padding: '12px', border: '1px solid #D4C5B8', borderRadius: '6px', fontFamily: font, fontSize: '18px', letterSpacing: '0.2em', textAlign: 'center', outline: 'none' }} />
              <button onClick={submitOtp} disabled={busy || otp.length < 4}
                style={{ padding: '12px', background: otp.length >= 4 ? '#2C2420' : '#D4C5B8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: font, fontSize: '14px' }}>
                {busy ? 'Checking…' : 'Submit code'}
              </button>
            </div>
          )}

          {stage === 'paid' && (
            <div className="flex flex-col items-center gap-2 py-2">
              <CheckCircle2 size={36} color="#16A34A" />
              <p style={{ fontFamily: font, fontSize: '14px', color: '#16A34A' }}>Payment received. Saving sale…</p>
            </div>
          )}

          {stage === 'failed' && (
            <>
              <div className="flex items-start gap-2 p-3" style={{ background: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA' }}>
                <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontFamily: font, fontWeight: 300, fontSize: '12px', color: '#DC2626', lineHeight: 1.5 }}>{message}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={onClose}
                  style={{ padding: '12px', background: '#F2EDE8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: font, fontSize: '14px', color: '#2C2420' }}>
                  Change method
                </button>
                <button onClick={startCharge}
                  style={{ padding: '12px', background: '#B76E79', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: font, fontSize: '14px', color: 'white' }}>
                  Send again
                </button>
              </div>
            </>
          )}

          {stage === 'waiting' && (
            <p style={{ fontFamily: font, fontWeight: 300, fontSize: '11px', color: '#8C7B74', textAlign: 'center' }}>
              Don’t close this until it says paid. If you close it, check the customer’s phone before charging again.
            </p>
          )}
        </div>
      </div>
      <style>{`@keyframes momo-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
