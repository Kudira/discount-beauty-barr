'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

interface Brand {
  name: string
  count: number
  image: string
  categories: string[]
}

interface BrandsClientProps {
  brands: Brand[]
  categories: string[]
}

export function BrandsClient({ brands, categories }: BrandsClientProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = useMemo(() => {
    return brands.filter((b) => {
      const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === 'all' || b.categories.includes(activeCategory)
      return matchSearch && matchCat
    })
  }, [brands, search, activeCategory])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px 11px 40px',
    background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px',
    color: '#2C2420', outline: 'none',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Search + filters */}
      <div className="flex flex-col gap-4 mb-10">

        {/* Search bar */}
        <div className="relative max-w-lg">
          <Search size={16} color="#B76E79"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands…"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
            onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8C7B74' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory('all')}
            style={{ padding: '6px 16px', borderRadius: '99px', border: 'none', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', background: activeCategory === 'all' ? '#2C2420' : 'white', color: activeCategory === 'all' ? 'white' : '#8C7B74', border: `1px solid ${activeCategory === 'all' ? 'transparent' : '#E8DDD4'}`, transition: 'all 0.15s' }}>
            All Categories
          </button>
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{ padding: '6px 16px', borderRadius: '99px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', background: activeCategory === cat ? '#2C2420' : 'white', color: activeCategory === cat ? 'white' : '#8C7B74', border: `1px solid ${activeCategory === cat ? 'transparent' : '#E8DDD4'}`, transition: 'all 0.15s', textTransform: 'capitalize' }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
          {filtered.length} brand{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'all' && ` in ${activeCategory}`}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* Brand grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '22px', color: '#8C7B74' }}>
            No brands found
          </p>
          <button onClick={() => { setSearch(''); setActiveCategory('all') }}
            style={{ marginTop: '12px', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', color: '#B76E79', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear filters →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filtered.map((brand) => (
            <Link
              key={brand.name}
              href={`/shop?brand=${encodeURIComponent(brand.name)}`}
              className="group flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-[#E8B4A0]/20"
              style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden', textDecoration: 'none' }}
            >
              {/* Brand image */}
              <div className="w-full flex items-center justify-center overflow-hidden relative"
                style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #FAF7F4, #F2EDE8)' }}>
                {brand.image ? (
                  <img
                    src={brand.image}
                    alt={brand.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#D4C5B8', letterSpacing: '-0.02em' }}>
                    {brand.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  style={{ background: 'rgba(183,110,121,0.2)' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: 'white', background: 'rgba(44,36,32,0.7)', padding: '6px 14px', borderRadius: '2px' }}>
                    View Products →
                  </span>
                </div>
              </div>

              {/* Brand info */}
              <div className="p-3">
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '15px', color: '#2C2420', lineHeight: 1.2, marginBottom: '3px' }}>
                  {brand.name}
                </p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#B76E79' }}>
                  {brand.count} product{brand.count !== 1 ? 's' : ''}
                </p>
                {brand.categories.length > 0 && (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '10px', color: '#C4B8B2', marginTop: '2px', textTransform: 'capitalize' }}>
                    {brand.categories.slice(0, 2).join(' · ')}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
