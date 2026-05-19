'use client'

import { PRODUCT_CATEGORIES } from '@/lib/constants'

import { X } from 'lucide-react'

interface Filters {
  category: string
  brand: string
  minPrice: number
  maxPrice: number
  sort: string
}

interface ProductFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  totalCount: number
  brands?: string[]  // dynamic brands from Supabase products
}

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest',   label: 'Newest' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc',   label: 'Name: A–Z' },
]

const labelStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontStyle: 'italic',
  fontWeight: 300,
  fontSize: '12px',
  letterSpacing: '0.1em',
  color: '#B76E79',
  display: 'block',
  marginBottom: '8px',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  background: '#FAF7F4',
  border: '1px solid #D4C5B8',
  borderRadius: '2px',
  fontFamily: "'Jost', sans-serif",
  fontWeight: 300,
  fontSize: '13px',
  color: '#2C2420',
  cursor: 'pointer',
  appearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238C7B74' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: '28px',
}

export function ProductFilters({ filters, onChange, totalCount, brands = [] }: ProductFiltersProps) {
  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.brand !== 'all' ||
    filters.minPrice > 0 ||
    filters.maxPrice < 1000

  const reset = () =>
    onChange({ category: 'all', brand: 'all', minPrice: 0, maxPrice: 1000, sort: 'featured' })

  return (
    <aside className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 400,
            fontSize: '20px',
            color: '#2C2420',
          }}
        >
          Filters
        </span>
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 300,
              fontSize: '11px',
              color: '#B76E79',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Result count */}
      <p
        style={{
          fontFamily: "'Jost', sans-serif",
          fontWeight: 300,
          fontSize: '12px',
          color: '#8C7B74',
          marginTop: '-8px',
        }}
      >
        {totalCount} product{totalCount !== 1 ? 's' : ''} found
      </p>

      {/* Sort */}
      <div style={{ borderTop: '1px solid #E8DDD4', paddingTop: '20px' }}>
        <label style={labelStyle}>Sort By</label>
        <select
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value })}
          style={selectStyle}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div style={{ borderTop: '1px solid #E8DDD4', paddingTop: '20px' }}>
        <label style={labelStyle}>Category</label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value="all"
              checked={filters.category === 'all'}
              onChange={() => onChange({ ...filters, category: 'all' })}
              style={{ accentColor: '#B76E79' }}
            />
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420' }}>
              All Categories
            </span>
          </label>
          {PRODUCT_CATEGORIES.map((cat) => (
            <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={filters.category === cat.value}
                onChange={() => onChange({ ...filters, category: cat.value })}
                style={{ accentColor: '#B76E79' }}
              />
              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420' }}>
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div style={{ borderTop: '1px solid #E8DDD4', paddingTop: '20px' }}>
        <label style={labelStyle}>Brand</label>
        <select
          value={filters.brand}
          onChange={(e) => onChange({ ...filters, brand: e.target.value })}
          style={selectStyle}
        >
          <option value="all">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div style={{ borderTop: '1px solid #E8DDD4', paddingTop: '20px' }}>
        <label style={labelStyle}>Price Range</label>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
              GHS {filters.minPrice}
            </span>
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
              GHS {filters.maxPrice === 1000 ? '1000+' : filters.maxPrice}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            step={10}
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
            style={{ width: '100%', accentColor: '#B76E79' }}
          />
        </div>
      </div>
    </aside>
  )
}
