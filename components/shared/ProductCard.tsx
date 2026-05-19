'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingBag, Heart, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { CategoryBadge } from '@/components/products/CategoryBadge'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [wishlisted, setWishlisted] = useState(false)
  const [added, setAdded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const { addItem, isInCart } = useCart()
  const { user } = useAuth()
  const supabase = createClient()

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    const newState = !wishlisted
    setWishlisted(newState)
    if (user) {
      if (newState) {
        await (supabase as any).from('wishlists').upsert({
          user_id: user.id, product_id: product.id,
        }, { onConflict: 'user_id,product_id' })
      } else {
        await (supabase as any).from('wishlists')
          .delete().eq('user_id', user.id).eq('product_id', product.id)
      }
    }
  }

  const firstVariant = product.variants[0]
  const price = firstVariant?.price ?? product.basePrice
  const alreadyInCart = isInCart(product.id, firstVariant?.id ?? '')
  const primaryImage = product.images?.[0]
  const hasImage = primaryImage && !imgError

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!firstVariant) return
    addItem({
      productId: product.id,
      variantId: firstVariant.id,
      name: product.name,
      brand: product.brand,
      image: primaryImage ?? '',
      variantName: firstVariant.name,
      price: firstVariant.price,
      quantity: 1,
      sku: firstVariant.sku,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className={cn(
      'group relative flex flex-col bg-white border border-[#E8DDD4]',
      'hover:border-[#B76E79] transition-all duration-300 hover:shadow-lg hover:shadow-[#E8B4A0]/15',
      className
    )}>
      {/* Image */}
      <Link href={`/shop/${product.slug}`} className="relative block overflow-hidden bg-[#FAF7F4]"
        style={{ aspectRatio: '3/4' }}>

        {hasImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: '#F2EDE8' }}>
              <ShoppingBag className="w-7 h-7" style={{ color: '#D4C5B8' }} />
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '11px', color: '#C4B8B2' }}>
              {product.brand}
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ background: 'white', border: '1px solid #D4C5B8' }}
          aria-label="Add to wishlist"
        >
          <Heart className="w-3.5 h-3.5 transition-colors"
            style={{ color: wishlisted ? '#B76E79' : '#8C7B74', fill: wishlisted ? '#B76E79' : 'none' }} />
        </button>

        {/* Featured badge */}
        {product.isFeatured && (
          <span className="absolute top-3 left-3 px-2 py-0.5"
            style={{ background: '#B76E79', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '11px' }}>
            Featured
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4">
        <CategoryBadge category={product.category} />
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#B76E79' }}>
          {product.brand}
        </span>
        <Link href={`/shop/${product.slug}`}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '16px', color: '#2C2420', lineHeight: 1.3 }}
            className="hover:text-[#B76E79] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        {product.variants.length > 1 && (
          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
            {product.variants.length} options available
          </span>
        )}
        <div className="flex items-center justify-between mt-1">
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420' }}>
            {formatCurrency(price)}
          </span>
          <button onClick={handleAdd}
            className="flex items-center gap-1.5 transition-all duration-200"
            style={{
              padding: '7px 14px',
              background: added ? '#22C55E' : alreadyInCart ? '#F2EDE8' : '#2C2420',
              color: added ? 'white' : alreadyInCart ? '#B76E79' : 'white',
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px',
              border: alreadyInCart && !added ? '1px solid #B76E79' : 'none',
              cursor: 'pointer', borderRadius: '2px',
            }}>
            {added
              ? <><Check className="w-3 h-3" /> Added</>
              : alreadyInCart
              ? <><ShoppingBag className="w-3 h-3" /> In Cart</>
              : <><ShoppingBag className="w-3 h-3" /> Add</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
