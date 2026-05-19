'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Mail } from 'lucide-react'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const orderNumber = params.get('order')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: '#F0FDF4' }}>
        <CheckCircle className="w-10 h-10" style={{ color: '#16A34A' }} />
      </div>

      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 'clamp(32px, 5vw, 48px)', color: '#2C2420', marginBottom: '12px', lineHeight: 1.1 }}>
        Order Confirmed!
      </h1>

      {orderNumber && (
        <div className="inline-block px-4 py-2 mb-6"
          style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '4px' }}>
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
            Order number: <strong style={{ color: '#2C2420' }}>{orderNumber}</strong>
          </span>
        </div>
      )}

      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '16px', color: '#8C7B74', lineHeight: 1.8, maxWidth: '400px', margin: '0 auto 32px' }}>
        Thank you for shopping with Discount Beauty Barr. We&apos;ll send you a confirmation email shortly and keep you updated on your order.
      </p>

      {/* What happens next */}
      <div className="flex flex-col gap-3 mb-10 text-left max-w-sm mx-auto">
        {[
          { icon: <Mail size={16} />, text: 'Confirmation email sent to your inbox' },
          { icon: <Package size={16} />, text: 'We\'ll notify you when your order is ready' },
          { icon: <CheckCircle size={16} />, text: 'Track your order in My Account' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#F2EDE8', color: '#B76E79' }}>
              {item.icon}
            </div>
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74' }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/account"
          style={{ padding: '13px 32px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none', borderRadius: '2px' }}>
          View My Orders
        </Link>
        <Link href="/shop"
          style={{ padding: '13px 32px', border: '1px solid #2C2420', color: '#2C2420', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none', borderRadius: '2px' }}>
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
