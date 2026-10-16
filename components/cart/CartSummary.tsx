import { formatCurrency } from '@/lib/utils'
import { FREE_DELIVERY_MINIMUM, DELIVERY_FEE } from '@/lib/constants'
import Link from 'next/link'

interface CartSummaryProps {
  subtotal: number
  deliveryFee: number
  total: number
  processingFee?: number
  mode?: 'cart' | 'checkout'
}

export function CartSummary({ subtotal, deliveryFee, total, processingFee = 0, mode = 'cart' }: CartSummaryProps) {
  const remaining = FREE_DELIVERY_MINIMUM - subtotal

  return (
    <div className="flex flex-col gap-4 p-6" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4' }}>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '22px', color: '#2C2420' }}>
        Order Summary
      </h3>

      {/* Free delivery progress */}
      {remaining > 0 && subtotal > 0 && (
        <div className="flex flex-col gap-2 p-3" style={{ background: '#F2EDE8', borderRadius: '2px' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#8C7B74', lineHeight: 1.6 }}>
            Add <span style={{ color: '#B76E79' }}>{formatCurrency(remaining)}</span> more for free delivery
          </p>
          <div style={{ height: '4px', background: '#E8DDD4', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((subtotal / FREE_DELIVERY_MINIMUM) * 100, 100)}%`, background: '#B76E79', borderRadius: '2px', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      )}

      {remaining <= 0 && subtotal > 0 && (
        <div className="p-3" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '2px' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#166534' }}>
            ✓ You qualify for free delivery!
          </p>
        </div>
      )}

      {/* Line items */}
      <div className="flex flex-col gap-3 pt-2" style={{ borderTop: '1px solid #E8DDD4' }}>
        <div className="flex justify-between">
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74' }}>Subtotal</span>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '14px', color: '#2C2420' }}>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74' }}>Delivery</span>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '14px', color: deliveryFee === 0 ? '#16A34A' : '#2C2420' }}>
            {deliveryFee === 0 ? (subtotal === 0 ? '—' : 'Free') : formatCurrency(DELIVERY_FEE)}
          </span>
        </div>
        {processingFee > 0 && (
          <div className="flex justify-between">
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74' }}>Card / MoMo processing fee (1.95%)</span>
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '14px', color: '#2C2420' }}>{formatCurrency(processingFee)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between pt-3" style={{ borderTop: '1px solid #E8DDD4' }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420' }}>Total</span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '22px', color: '#2C2420' }}>{formatCurrency(total)}</span>
      </div>

      {/* CTA */}
      {mode === 'cart' && (
        <Link href="/checkout"
          style={{ display: 'block', width: '100%', padding: '14px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', letterSpacing: '0.06em', textAlign: 'center', textDecoration: 'none', transition: 'background 0.2s', borderRadius: '2px', marginTop: '4px' }}
          className="hover:bg-[#B76E79]">
          Proceed to Checkout
        </Link>
      )}

      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#C4B8B2', textAlign: 'center', lineHeight: 1.6 }}>
        Secure checkout via Paystack · 7-day returns
      </p>
    </div>
  )
}
