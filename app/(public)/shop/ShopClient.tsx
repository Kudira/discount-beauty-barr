'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProductGrid } from '@/components/products/ProductGrid'
import { ProductFilters } from '@/components/products/ProductFilters'
import { ProductSearch } from '@/components/products/ProductSearch'
import { SlidersHorizontal, X } from 'lucide-react'
import type { Product } from '@/types'

interface Filters {
  category: string; brand: string; minPrice: number; maxPrice: number; sort: string
}
const defaultFilters: Filters = { category: 'all', brand: 'all', minPrice: 0, maxPrice: 1000, sort: 'featured' }

export function ShopClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    category: searchParams.get('category') ?? 'all',
    brand: searchParams.get('brand') ?? 'all',
  })
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // KEY FIX: sync filters when URL changes (navbar clicks cause client-side nav
  // without remounting the component, so useState init only runs once)
  useEffect(() => {
    const cat = searchParams.get('category') ?? 'all'
    const brand = searchParams.get('brand') ?? 'all'
    const q = searchParams.get('q') ?? ''
    setFilters((prev) => ({ ...prev, category: cat, brand: brand }))
    setSearch(q)
  }, [searchParams])

  const dynamicBrands = useMemo(
    () => [...new Set(products.map((p) => p.brand))].sort(),
    [products]
  )

  const filtered = useMemo(() => {
    let result = [...products]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      )
    }

    if (filters.category !== 'all') {
      result = result.filter((p) => p.category.toLowerCase() === filters.category.toLowerCase())
    }

    if (filters.brand !== 'all') {
      result = result.filter((p) => p.brand.toLowerCase() === filters.brand.toLowerCase())
    }

    result = result.filter((p) => {
      const price = p.variants[0]?.price ?? p.basePrice
      return price >= filters.minPrice && price <= filters.maxPrice
    })

    switch (filters.sort) {
      case 'featured':   result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)); break
      case 'newest':     result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
      case 'price-asc':  result.sort((a, b) => (a.variants[0]?.price ?? a.basePrice) - (b.variants[0]?.price ?? b.basePrice)); break
      case 'price-desc': result.sort((a, b) => (b.variants[0]?.price ?? b.basePrice) - (a.variants[0]?.price ?? a.basePrice)); break
      case 'name-asc':   result.sort((a, b) => a.name.localeCompare(b.name)); break
    }

    return result
  }, [products, search, filters])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex gap-3 mb-8">
        <div className="flex-1">
          <ProductSearch value={search} onChange={setSearch} />
        </div>
        <button onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 border border-[#D4C5B8] transition-colors"
          style={{ background: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#2C2420', cursor: 'pointer', borderRadius: '2px', whiteSpace: 'nowrap' }}>
          <SlidersHorizontal className="w-4 h-4" style={{ color: '#B76E79' }} /> Filters
        </button>
      </div>

      <div className="flex gap-10">
        <div className="hidden lg:block w-56 flex-shrink-0">
          <ProductFilters filters={filters} onChange={setFilters} totalCount={filtered.length} brands={dynamicBrands} />
        </div>
        <div className="flex-1 min-w-0">
          <ProductGrid products={filtered} />
        </div>
      </div>

      {mobileFiltersOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(44,36,32,0.4)', display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setMobileFiltersOpen(false)}>
          <div style={{ width: '100%', maxHeight: '85vh', background: '#FAF7F4', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8DDD4', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420' }}>Filter Products</span>
              <button onClick={() => setMobileFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2C2420' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
              <ProductFilters filters={filters} onChange={setFilters} totalCount={filtered.length} brands={dynamicBrands} />
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid #E8DDD4', flexShrink: 0 }}>
              <button onClick={() => setMobileFiltersOpen(false)}
                style={{ width: '100%', padding: '14px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', letterSpacing: '0.06em', border: 'none', cursor: 'pointer' }}>
                Show {filtered.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
