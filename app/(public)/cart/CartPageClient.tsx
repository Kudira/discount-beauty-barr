'use client'

import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { CartItem } from '@/components/cart/CartItem'
import { CartSummary } from '@/components/cart/CartSummary'
import { EmptyCart } from '@/components/cart/EmptyCart'
import { PageHero } from '@/components/shared/PageHero'

export function CartPageClient() {
  const { items, subtotal, deliveryFee, total, clearCart } = useCart()

  return (
    <>
      <PageHero eyebrow="Shopping" title="Your Cart" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            {/* Back + clear */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/shop" className="flex items-center gap-1.5 transition-colors"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#8C7B74', textDecoration: 'none' }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Continue Shopping
              </Link>
              <button onClick={clearCart} className="flex items-center gap-1.5 transition-colors"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#C4B8B2', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Trash2 className="w-3.5 h-3.5" /> Clear cart
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Items */}
              <div className="lg:col-span-2">
                <div style={{ borderTop: '1px solid #E8DDD4' }}>
                  {items.map((item) => (
                    <CartItem key={`${item.productId}-${item.variantId}`} item={item} />
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <CartSummary subtotal={subtotal} deliveryFee={deliveryFee} total={total} mode="cart" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
