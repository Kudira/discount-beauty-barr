'use client'

import { useState } from 'react'
import { ShoppingBag, Heart, ArrowLeft, Check, Minus, Plus } from 'lucide-react'
import Link from 'next/link'
import { CategoryBadge } from '@/components/products/CategoryBadge'
import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/context/CartContext'
import type { Product } from '@/types'

interface ProductDetailClientProps {
  product: Product
  related?: Product[]
}

export function ProductDetailClient({ product, related = [] }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0])
  const [quantity, setQuantity] = useState(1)
  const [wishlisted, setWishlisted] = useState(false)
  const [added, setAdded] = useState(false)
  const [selectedImg, setSelectedImg] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const { addItem, isInCart } = useCart()

  const inCart = isInCart(product.id, selectedVariant.id)
  const maxQty = selectedVariant.stock
  const outOfStock = maxQty === 0

  // Get images — product-level first, then variant-level, fallback to empty
  const allImages = product.images?.filter(Boolean) ?? []
  const hasImages = allImages.length > 0

  const handleVariantChange = (variant: typeof selectedVariant) => {
    setSelectedVariant(variant)
    setQuantity(1)
    setAdded(false)
    setSelectedImg(0)
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      brand: product.brand,
      image: allImages[0] ?? '',
      variantName: selectedVariant.name,
      price: selectedVariant.price,
      quantity,
      sku: selectedVariant.sku,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
  }

  const variantLabel =
    product.category === 'makeup' ? 'Select Shade'
    : product.category === 'fragrance' ? 'Select Size'
    : 'Select Size'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <Link href="/shop" className="flex items-center gap-1 transition-colors"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#8C7B74', textDecoration: 'none' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
        </Link>
        <span style={{ color: '#D4C5B8' }}>/</span>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#B76E79' }}>
          {product.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

        {/* ── Image panel ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">

          {/* Main image */}
          <div className="w-full relative overflow-hidden"
            style={{ aspectRatio: '1/1', background: 'linear-gradient(145deg, #FAF7F4, #F2EDE8)', border: '1px solid #E8DDD4' }}>

            {/* Wishlist */}
            <button onClick={() => setWishlisted(!wishlisted)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center z-10 transition-all"
              style={{ background: 'white', border: wishlisted ? '1px solid #B76E79' : '1px solid #D4C5B8', borderRadius: '50%', cursor: 'pointer' }}
              aria-label="Wishlist">
              <Heart className="w-4 h-4"
                style={{ color: wishlisted ? '#B76E79' : '#8C7B74', fill: wishlisted ? '#B76E79' : 'none' }} />
            </button>

            {hasImages && !imgErrors[selectedImg] ? (
              <img
                src={allImages[selectedImg]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImgErrors((p) => ({ ...p, [selectedImg]: true }))}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{ background: '#F2EDE8' }}>
                  <ShoppingBag className="w-10 h-10" style={{ color: '#D4C5B8' }} />
                </div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#C4B8B2' }}>
                  {hasImages ? 'Image unavailable' : 'Product image coming soon'}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {hasImages && allImages.length > 1 && (
            <div className="flex gap-3 flex-wrap">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className="w-20 h-20 overflow-hidden flex-shrink-0 transition-all"
                  style={{
                    border: selectedImg === i ? '2px solid #B76E79' : '1px solid #E8DDD4',
                    borderRadius: '2px', background: '#FAF7F4', cursor: 'pointer', padding: 0,
                  }}>
                  {!imgErrors[i] ? (
                    <img src={img} alt="" className="w-full h-full object-cover"
                      onError={() => setImgErrors((p) => ({ ...p, [i]: true }))} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" style={{ color: '#D4C5B8' }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product info ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6">

          {/* Badges */}
          <div className="flex items-center gap-3">
            <CategoryBadge category={product.category} />
            {product.isFeatured && (
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: 'white', background: '#B76E79', padding: '2px 10px', borderRadius: '2px' }}>
                Featured
              </span>
            )}
          </div>

          {/* Brand + name */}
          <div>
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B76E79', display: 'block', marginBottom: '6px' }}>
              {product.brand}
            </span>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: 'clamp(28px, 4vw, 40px)', color: '#2C2420', lineHeight: 1.15 }}>
              {product.name}
            </h1>
          </div>

          {/* Price */}
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '32px', color: '#2C2420' }}>
            {formatCurrency(selectedVariant.price)}
            {quantity > 1 && (
              <span style={{ fontSize: '16px', color: '#8C7B74', marginLeft: '8px', fontStyle: 'italic' }}>
                × {quantity} = {formatCurrency(selectedVariant.price * quantity)}
              </span>
            )}
          </div>

          {/* Description */}
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', lineHeight: 1.85, color: '#8C7B74', paddingBottom: '20px', borderBottom: '1px solid #E8DDD4' }}>
            {product.description}
          </p>

          {/* Variant selector */}
          {product.variants.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', letterSpacing: '0.08em', color: '#B76E79' }}>
                  {variantLabel}
                </span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
                  Selected: <strong style={{ color: '#2C2420', fontWeight: 400 }}>{selectedVariant.name}</strong>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button key={v.id} onClick={() => handleVariantChange(v)} disabled={v.stock === 0}
                    style={{
                      padding: '9px 18px',
                      border: selectedVariant.id === v.id ? '1.5px solid #B76E79' : '1px solid #D4C5B8',
                      background: selectedVariant.id === v.id ? '#FDF5F6' : v.stock === 0 ? '#F9F9F9' : 'white',
                      fontFamily: "'Jost', sans-serif", fontWeight: selectedVariant.id === v.id ? 400 : 300, fontSize: '13px',
                      color: selectedVariant.id === v.id ? '#B76E79' : v.stock === 0 ? '#C4B8B2' : '#2C2420',
                      cursor: v.stock === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.15s', borderRadius: '2px',
                      textDecoration: v.stock === 0 ? 'line-through' : 'none',
                    }}>
                    {v.name}
                    {v.stock === 0 && <span style={{ fontSize: '9px', color: '#C4B8B2', display: 'block', lineHeight: 1 }}>Out of stock</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          {!outOfStock && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', letterSpacing: '0.08em', color: '#B76E79' }}>
                  Quantity
                </span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
                  {selectedVariant.stock > 5 ? 'In stock' : `Only ${selectedVariant.stock} left`}
                </span>
              </div>
              <div className="flex items-center" style={{ border: '1px solid #D4C5B8', borderRadius: '2px', width: 'fit-content' }}>
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}
                  className="flex items-center justify-center transition-colors"
                  style={{ width: '44px', height: '44px', background: quantity <= 1 ? '#FAF7F4' : 'white', border: 'none', borderRight: '1px solid #D4C5B8', cursor: quantity <= 1 ? 'not-allowed' : 'pointer', color: quantity <= 1 ? '#C4B8B2' : '#2C2420' }}
                  aria-label="Decrease quantity">
                  <Minus className="w-4 h-4" />
                </button>
                <span style={{ width: '56px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420', background: 'white' }}>
                  {quantity}
                </span>
                <button onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty}
                  className="flex items-center justify-center transition-colors"
                  style={{ width: '44px', height: '44px', background: quantity >= maxQty ? '#FAF7F4' : 'white', border: 'none', borderLeft: '1px solid #D4C5B8', cursor: quantity >= maxQty ? 'not-allowed' : 'pointer', color: quantity >= maxQty ? '#C4B8B2' : '#2C2420' }}
                  aria-label="Increase quantity">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Out of stock */}
          {outOfStock && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#EF4444' }} />
              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#EF4444' }}>
                Out of stock — check back soon
              </span>
            </div>
          )}

          {/* Add to cart */}
          <div className="flex gap-3">
            <button onClick={handleAddToCart} disabled={outOfStock}
              className="flex-1 flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                padding: '15px 24px', border: 'none', cursor: outOfStock ? 'not-allowed' : 'pointer', borderRadius: '2px',
                background: added ? '#22C55E' : outOfStock ? '#D4C5B8' : '#2C2420',
                color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '16px', letterSpacing: '0.06em',
              }}>
              {added ? <><Check className="w-4 h-4" /> Added to Cart!</>
                : outOfStock ? 'Out of Stock'
                : <><ShoppingBag className="w-4 h-4" /> Add {quantity > 1 ? `${quantity} ` : ''}to Cart</>}
            </button>
            <button onClick={() => setWishlisted(!wishlisted)}
              style={{ width: '52px', height: '52px', border: wishlisted ? '1px solid #B76E79' : '1px solid #D4C5B8', background: wishlisted ? '#FDF5F6' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', borderRadius: '2px' }}
              aria-label="Wishlist">
              <Heart className="w-5 h-5" style={{ color: wishlisted ? '#B76E79' : '#8C7B74', fill: wishlisted ? '#B76E79' : 'none' }} />
            </button>
          </div>

          {/* View cart */}
          {(inCart || added) && (
            <Link href="/cart"
              style={{ display: 'block', padding: '12px', border: '1px solid #B76E79', color: '#B76E79', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', letterSpacing: '0.06em', textAlign: 'center', textDecoration: 'none', borderRadius: '2px', transition: 'all 0.2s' }}
              className="hover:bg-[#B76E79] hover:text-white">
              View Cart →
            </Link>
          )}

          {/* SKU */}
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#C4B8B2', letterSpacing: '0.08em' }}>
            SKU: {selectedVariant.sku}
          </p>

          {/* Delivery info */}
          <div className="flex flex-col gap-2 p-4" style={{ background: '#F2EDE8', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
            {[
              '✦ Free delivery on orders over GHS 300',
              '✦ Click & Collect at Osu & East Legon',
              '✦ 7-day returns on unopened products',
            ].map((note) => (
              <span key={note} style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#8C7B74', lineHeight: 1.7 }}>
                {note}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#E8DDD4]">
          <div className="mb-8 text-center">
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#B76E79', letterSpacing: '0.1em' }}>
              You May Also Like
            </span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420', marginTop: '4px' }}>
              Related Products
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.slice(0, 4).map((p) => {
              const img = p.images?.[0]
              const price = p.variants[0]?.price ?? p.basePrice
              return (
                <a key={p.id} href={`/shop/${p.slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', background: 'white', border: '1px solid #E8DDD4', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1/1', background: '#FAF7F4', overflow: 'hidden' }}>
                    {img
                      ? <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4C5B8' }}>✦</div>
                    }
                  </div>
                  <div style={{ padding: '12px' }}>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: '#B76E79', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{p.brand}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', color: '#2C2420', marginBottom: '4px', lineHeight: 1.3 }}>{p.name}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', color: '#2C2420' }}>GHS {price.toFixed(2)}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
