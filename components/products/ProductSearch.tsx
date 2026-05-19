'use client'

import { Search, X } from 'lucide-react'

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
}

export function ProductSearch({ value, onChange }: ProductSearchProps) {
  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: '#B76E79' }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products or brands..."
        style={{
          width: '100%',
          padding: '11px 40px',
          background: 'white',
          border: '1px solid #D4C5B8',
          borderRadius: '2px',
          fontFamily: "'Jost', sans-serif",
          fontWeight: 300,
          fontSize: '14px',
          color: '#2C2420',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
        onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: '#8C7B74', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
