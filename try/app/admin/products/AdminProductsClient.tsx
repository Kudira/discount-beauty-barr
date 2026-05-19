'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, Eye, EyeOff, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function AdminProductsClient({ products }: { products: any[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [localProducts, setLocalProducts] = useState(products)
  const router = useRouter()
  const supabase = createClient()

  const filtered = useMemo(() => {
    return localProducts.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
      const matchCat = category === 'all' || p.category === category
      return matchSearch && matchCat
    })
  }, [localProducts, search, category])

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase.from('products') as any).update({ is_active: !current }).eq('id', id)
    setLocalProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !current } : p))
  }

  const toggleFeatured = async (id: string, current: boolean) => {
    await (supabase.from('products') as any).update({ is_featured: !current }).eq('id', id)
    setLocalProducts((prev) => prev.map((p) => p.id === id ? { ...p, is_featured: !current } : p))
  }

  const CATEGORIES = ['all', 'skincare', 'makeup', 'haircare', 'fragrance', 'tools', 'body']

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>Products</h1>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>{localProducts.length} total products</p>
        </div>
        <Link href="/admin/products/new"
          className="flex items-center gap-2"
          style={{ padding: '10px 20px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', letterSpacing: '0.04em', textDecoration: 'none', borderRadius: '4px' }}>
          <Plus size={15} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} color="#B76E79" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products or brands..."
            style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none' }} />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '10px 14px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none', cursor: 'pointer' }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {/* Products table */}
      <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8DDD4' }}>
                {['Product', 'Category', 'Brand', 'Variants', 'Price', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C7B74', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const minPrice = product.product_variants?.length > 0
                  ? Math.min(...product.product_variants.map((v: any) => v.price))
                  : product.base_price
                return (
                  <tr key={product.id} style={{ borderBottom: '1px solid #F2EDE8' }}>
                    <td style={{ padding: '12px 14px', maxWidth: '200px' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }} className="truncate">{product.name}</p>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#B76E79', background: '#FDF5F6', padding: '2px 8px', borderRadius: '99px', textTransform: 'capitalize' }}>{product.category}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>{product.brand}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420' }}>{product.product_variants?.length ?? 0}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '14px', color: '#2C2420' }}>
                        {formatCurrency(minPrice)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: product.is_active ? '#16A34A' : '#DC2626', background: product.is_active ? '#F0FDF4' : '#FEF2F2', padding: '2px 8px', borderRadius: '99px' }}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleFeatured(product.id, product.is_featured)} title={product.is_featured ? 'Remove featured' : 'Mark featured'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          <Star size={14} color={product.is_featured ? '#F59E0B' : '#D4C5B8'} fill={product.is_featured ? '#F59E0B' : 'none'} />
                        </button>
                        <button onClick={() => toggleActive(product.id, product.is_active)} title={product.is_active ? 'Deactivate' : 'Activate'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                          {product.is_active ? <EyeOff size={14} color="#8C7B74" /> : <Eye size={14} color="#8C7B74" />}
                        </button>
                        <Link href={`/admin/products/${product.id}/edit`} style={{ padding: '4px', color: '#B76E79', textDecoration: 'none', display: 'flex' }} title='Edit product'>
                          <Edit2 size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
