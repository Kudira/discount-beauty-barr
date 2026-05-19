'use client'

import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { formatCurrency } from '@/lib/utils'
import type { CartItem as CartItemType } from '@/types'

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateQty, removeItem } = useCart()

  return (
    <div className="flex gap-4 py-5" style={{ borderBottom: '1px solid #E8DDD4' }}>
      {/* Product image */}
      <div className="w-20 h-20 flex-shrink-0 overflow-hidden"
        style={{ background: '#F2EDE8', border: '1px solid #E8DDD4' }}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" style={{ color: '#D4C5B8' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B76E79' }}>
          {item.brand}
        </span>
        <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '16px', color: '#2C2420', lineHeight: 1.3 }}
          className="line-clamp-2">
          {item.name}
        </h4>
        {item.variantName && (
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
            {item.variantName}
          </span>
        )}

        {/* Qty + remove */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center transition-colors"
              style={{ border: '1px solid #D4C5B8', background: 'white', cursor: 'pointer', borderRadius: '2px' }}
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" style={{ color: '#8C7B74' }} />
            </button>
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '14px', color: '#2C2420', minWidth: '32px', textAlign: 'center' }}>
              {item.quantity}
            </span>
            <button
              onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center transition-colors"
              style={{ border: '1px solid #D4C5B8', background: 'white', cursor: 'pointer', borderRadius: '2px' }}
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" style={{ color: '#8C7B74' }} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420' }}>
              {formatCurrency(item.price * item.quantity)}
            </span>
            <button
              onClick={() => removeItem(item.productId, item.variantId)}
              className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-red-50 rounded"
              style={{ color: '#C4B8B2', border: 'none', background: 'transparent', cursor: 'pointer' }}
              aria-label="Remove item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
