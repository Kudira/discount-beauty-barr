'use client'

import { ShoppingBag, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface POSProductCardProps {
  product: Product
  onAdd: (product: Product, variantId: string) => void
}

export function POSProductCard({ product, onAdd }: POSProductCardProps) {
  const firstVariant = product.variants[0]
  const image = product.images?.[0]

  // If only one variant, add directly. If multiple, show first variant.
  const soldOut = !!product.clearance && product.clearance.remaining <= 0
  const handleTap = () => {
    if (soldOut) return
    if (firstVariant) onAdd(product, firstVariant.id)
  }

  return (
    <button
      onClick={handleTap}
      disabled={soldOut}
      className="group relative flex flex-col text-left w-full transition-all duration-150 active:scale-95"
      style={{
        background: 'white',
        border: '1px solid #E8DDD4',
        borderRadius: '6px',
        overflow: 'hidden',
        cursor: soldOut ? 'not-allowed' : 'pointer',
        opacity: soldOut ? 0.55 : 1,
      }}
    >
      {/* Image */}
      <div className="w-full relative" style={{ aspectRatio: '1/1', background: '#FAF7F4' }}>
        {image ? (
          <img src={image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <ShoppingBag size={24} color="#D4C5B8" />
            <span style={{ fontSize: '9px', color: '#C4B8B2', fontFamily: "'Jost', sans-serif" }}>
              {product.brand}
            </span>
          </div>
        )}

        {product.clearance && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5"
            style={{ background: soldOut ? '#8C7B74' : '#B8862B', color: 'white', fontSize: '9px', borderRadius: '3px', fontFamily: "'Jost', sans-serif", letterSpacing: '0.06em', fontWeight: 500 }}>
            {soldOut ? 'SOLD OUT' : `CLEARANCE · ${product.clearance.remaining} left`}
          </span>
        )}

        {/* Quick add overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(183,110,121,0.85)' }}>
          <Plus size={28} color="white" />
        </div>

        {/* Variant count badge */}
        {product.variants.length > 1 && (
          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5"
            style={{ background: '#2C2420', color: 'white', fontSize: '9px', borderRadius: '3px', fontFamily: "'Jost', sans-serif" }}>
            {product.variants.length} opts
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-0.5">
        <p style={{ fontSize: '10px', color: '#B76E79', fontWeight: 300, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Jost', sans-serif" }}>
          {product.brand}
        </p>
        <p style={{ fontSize: '12px', color: '#2C2420', fontWeight: 400, lineHeight: 1.3, fontFamily: "'Jost', sans-serif" }}
          className="line-clamp-2">
          {product.name}
        </p>
        <p style={{ fontSize: '13px', color: '#2C2420', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, marginTop: '2px' }}>
          {formatCurrency(firstVariant?.price ?? product.basePrice)}
          {product.clearance && (
            <s style={{ marginLeft: '6px', fontSize: '11px', color: '#A09088' }}>{formatCurrency(product.clearance.originalPrice)}</s>
          )}
        </p>
      </div>
    </button>
  )
}
