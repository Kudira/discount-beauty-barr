'use client'

import { X, ShoppingBag, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface POSVariantModalProps {
  product: Product
  onSelect: (product: Product, variantId: string) => void
  onClose: () => void
}

export function POSVariantModal({ product, onSelect, onClose }: POSVariantModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(44,36,32,0.5)' }}
      onClick={onClose}>
      <div className="w-full sm:max-w-md flex flex-col"
        style={{ background: 'white', borderRadius: '12px 12px 0 0', maxHeight: '80vh', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#E8DDD4' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#B76E79', fontFamily: "'Jost', sans-serif", fontWeight: 300, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {product.brand}
            </p>
            <h3 style={{ fontSize: '16px', color: '#2C2420', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>
              {product.name}
            </h3>
          </div>
          <button onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: '#F2EDE8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2C2420' }}>
            <X size={16} />
          </button>
        </div>

        {/* Variants */}
        <div className="overflow-y-auto p-4 flex flex-col gap-2">
          <p style={{ fontSize: '12px', color: '#8C7B74', fontFamily: "'Jost', sans-serif", fontWeight: 300, marginBottom: '4px' }}>
            Select a variant:
          </p>
          {product.variants.map((v) => {
            const lowStock = v.stock > 0 && v.stock <= 5
            const noStock = v.stock <= 0
            return (
              <button key={v.id}
                onClick={() => { onSelect(product, v.id); onClose() }}
                className="flex items-center justify-between p-3 w-full transition-all hover:border-[#B76E79]"
                style={{ border: '1px solid #E8DDD4', borderRadius: '6px', background: 'white', cursor: 'pointer', textAlign: 'left' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: '#F2EDE8', overflow: 'hidden', flexShrink: 0 }}>
                    {v.images?.[0]
                      ? <img src={v.images[0]} alt={v.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={14} color="#D4C5B8" /></div>}
                  </div>
                  <div>
                    <p style={{ fontSize: '14px', color: '#2C2420', fontFamily: "'Jost', sans-serif", fontWeight: 400 }}>
                      {v.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p style={{ fontSize: '11px', color: '#8C7B74', fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>
                        SKU: {v.sku}
                      </p>
                      {noStock
                        ? <span style={{ fontSize: '10px', color: '#D97706', fontFamily: "'Jost', sans-serif", display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertCircle size={10} /> 0 recorded · can still sell
                          </span>
                        : lowStock
                        ? <span style={{ fontSize: '10px', color: '#D97706', fontFamily: "'Jost', sans-serif" }}>
                            Low: {v.stock} left
                          </span>
                        : <span style={{ fontSize: '10px', color: '#16A34A', fontFamily: "'Jost', sans-serif" }}>
                            {v.stock} in stock
                          </span>
                      }
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '16px', color: '#2C2420', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, flexShrink: 0 }}>
                  {formatCurrency(v.price)}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
