import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CheckoutClient } from './CheckoutClient'

export const metadata: Metadata = { title: 'Checkout' }
export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF7F4' }}>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>
          Loading checkout…
        </p>
      </div>
    }>
      <CheckoutClient />
    </Suspense>
  )
}
