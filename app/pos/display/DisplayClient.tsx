'use client'

import { useEffect, useState } from 'react'
import { DISPLAY_CHANNEL, type DisplayMessage, type DisplayState } from '@/lib/pos/customer-display'
import { formatCurrency } from '@/lib/utils'
import { ShoppingBag, CheckCircle2 } from 'lucide-react'

const BRANCH_LABELS: Record<string, string> = {
  osu: 'Osu Branch',
  'east-legon': 'East Legon Branch',
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  momo: 'Mobile Money',
}

export function DisplayClient() {
  const [state, setState] = useState<DisplayState | null>(null)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(DISPLAY_CHANNEL)
    channel.onmessage = (e: MessageEvent<DisplayMessage>) => {
      if (e.data?.type === 'state') setState(e.data)
    }
    // Ask whichever till window is open right now to send its current state,
    // so this screen isn't blank until the next cart change.
    channel.postMessage({ type: 'hello' })
    return () => channel.close()
  }, [])

  if (!state || state.stage === 'idle' || state.items.length === 0) {
    return <IdleScreen branchId={state?.branchId} />
  }

  if (state.stage === 'paid') {
    return <PaidScreen state={state} />
  }

  return <ShoppingScreen state={state} />
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: '#2C2420',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Jost', sans-serif",
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

function IdleScreen({ branchId }: { branchId?: string }) {
  return (
    <Shell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '18px', textAlign: 'center', padding: '24px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '56px', letterSpacing: '1px' }}>
          Discount Beauty Barr
        </div>
        {branchId && (
          <div style={{ fontSize: '16px', color: '#E8B4A0', letterSpacing: '0.5px' }}>
            {BRANCH_LABELS[branchId] ?? branchId}
          </div>
        )}
        <div style={{ marginTop: '12px', fontSize: '15px', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
          Welcome — your order will appear here
        </div>
      </div>
    </Shell>
  )
}

function ShoppingScreen({ state }: { state: DisplayState }) {
  return (
    <Shell>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '22px' }}>
          Discount Beauty Barr <span style={{ color: '#E8B4A0' }}>·</span> {BRANCH_LABELS[state.branchId] ?? state.branchId}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          <ShoppingBag size={16} />
          {state.items.reduce((s, i) => s + i.quantity, 0)} item{state.items.reduce((s, i) => s + i.quantity, 0) === 1 ? '' : 's'}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px' }}>
        {state.items.map((item, idx) => (
          <div
            key={`${item.name}-${item.variantName}-${idx}`}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
              animation: 'dbb-fade-in 0.25s ease-out',
            }}
          >
            <div>
              <div style={{ fontSize: '16px', fontWeight: 400 }}>{item.name}</div>
              {item.variantName && (
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{item.variantName}</div>
              )}
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                {item.quantity} × {formatCurrency(item.price)}
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 500 }}>
              {formatCurrency(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'rgba(255,255,255,0.55)', marginBottom: '4px' }}>
          <span>Subtotal</span>
          <span>{formatCurrency(state.subtotal)}</span>
        </div>
        {state.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#E8B4A0', marginBottom: '4px' }}>
            <span>Discount</span>
            <span>-{formatCurrency(state.discount)}</span>
          </div>
        )}
        <div
          key={state.total}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginTop: '10px', fontFamily: "'Cormorant Garamond', serif",
            animation: 'dbb-pulse 0.3s ease-out',
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 300 }}>Total</span>
          <span style={{ fontSize: '36px', fontWeight: 500, color: '#E8B4A0' }}>{formatCurrency(state.total)}</span>
        </div>

        {state.stage === 'confirm' && state.paymentMethod && (
          <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '6px', background: 'rgba(232,180,160,0.12)', border: '1px solid rgba(232,180,160,0.3)', fontSize: '14px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Paying by {PAYMENT_LABELS[state.paymentMethod] ?? state.paymentMethod}</span>
            {state.paymentMethod === 'cash' && typeof state.cashPaid === 'number' && state.cashPaid > 0 && (
              <span>Tendered {formatCurrency(state.cashPaid)}</span>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes dbb-fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dbb-pulse { 0% { opacity: 0.4; } 100% { opacity: 1; } }
      `}</style>
    </Shell>
  )
}

function PaidScreen({ state }: { state: DisplayState }) {
  return (
    <Shell>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', textAlign: 'center', padding: '24px' }}>
        <CheckCircle2 size={72} color="#8FBF8F" />
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px' }}>
          Payment received
        </div>
        <div style={{ fontSize: '48px', fontWeight: 500, color: '#E8B4A0', fontFamily: "'Cormorant Garamond', serif" }}>
          {formatCurrency(state.total)}
        </div>
        {typeof state.change === 'number' && state.change > 0 && (
          <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)' }}>
            Change due: {formatCurrency(state.change)}
          </div>
        )}
        <div style={{ marginTop: '12px', fontSize: '15px', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
          Thank you for shopping with us!
        </div>
      </div>
    </Shell>
  )
}
