'use client'

import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'
import { ProductCard } from '@/components/shared/ProductCard'
import { PageHero } from '@/components/shared/PageHero'
import Link from 'next/link'
import type { Product } from '@/types'

export function SearchClient({ products }: { products: Product[] }) {
  const params = useSearchParams()
  const q = params.get('q') ?? ''

  const results = useMemo(() => {
    if (!q.trim()) return []
    const lower = q.toLowerCase()
    return products.filter((p) =>
      p.name.toLowerCase().includes(lower) ||
      p.brand.toLowerCase().includes(lower) ||
      p.description?.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(lower) || v.name.toLowerCase().includes(lower))
    )
  }, [products, q])

  return (
    <>
      <PageHero eyebrow="Search" title={q ? `Results for "${q}"` : 'Search Products'} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!q ? (
          <div className="text-center py-16">
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '20px', color: '#8C7B74' }}>
              Enter a search term to find products.
            </p>
            <Link href="/shop" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 28px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', textDecoration: 'none', borderRadius: '2px' }}>
              Browse All Products
            </Link>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '24px', color: '#2C2420', marginBottom: '8px' }}>
              No results for &ldquo;{q}&rdquo;
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', marginBottom: '20px' }}>
              Try a different search term or browse our full collection.
            </p>
            <Link href="/shop" style={{ display: 'inline-block', padding: '12px 28px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', textDecoration: 'none', borderRadius: '2px' }}>
              Shop All Products
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74', marginBottom: '24px' }}>
              {results.length} product{results.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
