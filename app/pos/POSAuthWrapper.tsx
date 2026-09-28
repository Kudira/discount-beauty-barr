'use client'

import { useCallback, useEffect, useState } from 'react'
import { LogIn } from 'lucide-react'
import { POSClient } from './POSClient'
import type { Product } from '@/types'

export interface Cashier {
  name: string
  role: string
  branchId: string | null
}

interface POSAuthWrapperProps {
  products: Product[]
  defaultBranch: string
  initialCashier: Cashier | null
}

const MAX_PIN = 6

export function POSAuthWrapper({ products, defaultBranch, initialCashier }: POSAuthWrapperProps) {
  const [cashier, setCashier] = useState<Cashier | null>(initialCashier)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleDigit = useCallback((d: string) => {
    setError('')
    setPin((p) => (p.length < MAX_PIN ? p + d : p))
  }, [])
  const handleDelete = useCallback(() => setPin((p) => p.slice(0, -1)), [])

  const handleLogin = useCallback(async () => {
    if (pin.length < 4 || checking) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/pos/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error ?? 'Could not sign in. Try again.')
        setPin('')
        return
      }
      setCashier({ name: json.name, role: json.role, branchId: json.branchId })
      setPin('')
    } catch {
      setError('No connection. Check the internet and try again.')
      setPin('')
    } finally {
      setChecking(false)
    }
  }, [pin, checking])

  const handleLogout = useCallback(async () => {
    await fetch('/api/pos/logout', { method: 'POST' }).catch(() => {})
    setCashier(null)
    setPin('')
    setError('')
  }, [])

  // Physical keyboard / numpad support on the till
  useEffect(() => {
    if (cashier) return
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) handleDigit(e.key)
      else if (e.key === 'Backspace') handleDelete()
      else if (e.key === 'Enter') handleLogin()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cashier, handleDigit, handleDelete, handleLogin])

  if (cashier) {
    return (
      <POSClient
        products={products}
        cashierName={cashier.name}
        branchId={cashier.branchId ?? defaultBranch}
        onLogout={handleLogout}
      />
    )
  }

  const canSubmit = pin.length >= 4 && !checking

  return (
    <div style={{
      minHeight: '100vh', overflowY: 'auto', background: '#2C2420',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '22px', width: '100%', maxWidth: '340px' }}>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '26px', color: 'white', letterSpacing: '0.04em', margin: 0 }}>
            Discount Beauty Barr<span style={{ color: '#E8B4A0' }}>.</span>
          </h1>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '8px' }}>
            Enter your PIN to start selling
          </p>
        </div>

        {/* PIN dots */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: '14px' }} aria-label={`${pin.length} digits entered`}>
          {Array.from({ length: MAX_PIN }).map((_, i) => (
            <div key={i} style={{
              width: '12px', height: '12px', borderRadius: '50%',
              background: i < pin.length ? '#E8B4A0' : 'rgba(255,255,255,0.15)',
              transition: 'background 0.15s',
            }} />
          ))}
        </div>

        <p role="alert" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#FCA5A5', textAlign: 'center', margin: 0, minHeight: '18px' }}>
          {error}
        </p>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '100%' }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => {
            if (d === '') return <div key={i} />
            const isDelete = d === '⌫'
            return (
              <button key={i} type="button" aria-label={isDelete ? 'Delete digit' : d}
                onClick={() => (isDelete ? handleDelete() : handleDigit(d))}
                disabled={checking}
                style={{
                  height: '62px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: 'rgba(255,255,255,0.1)', color: 'white',
                  fontFamily: isDelete ? 'system-ui' : "'Cormorant Garamond', serif",
                  fontSize: isDelete ? '18px' : '26px', fontWeight: 300,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onPointerDown={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
                onPointerUp={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onPointerLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
                {d}
              </button>
            )
          })}
        </div>

        <button type="button" onClick={handleLogin} disabled={!canSubmit}
          style={{
            width: '100%', padding: '15px', borderRadius: '8px', border: 'none',
            background: canSubmit ? '#B76E79' : 'rgba(255,255,255,0.1)',
            color: 'white', cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
          <LogIn size={16} /> {checking ? 'Checking…' : 'Sign in'}
        </button>
      </div>
    </div>
  )
}
