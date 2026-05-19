'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

const CATEGORIES = ['skincare', 'makeup', 'haircare', 'fragrance', 'tools', 'body']

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', brand: '', category: 'skincare', description: '', is_featured: false,
  })
  const [variants, setVariants] = useState([
    { name: '', sku: '', price: '', stockOsu: '0', stockEastLegon: '0' },
  ])

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }))

  const addVariant = () =>
    setVariants((v) => [...v, { name: '', sku: '', price: '', stockOsu: '0', stockEastLegon: '0' }])

  const removeVariant = (i: number) =>
    setVariants((v) => v.filter((_, idx) => idx !== i))

  const updateVariant = (i: number, field: string, value: string) =>
    setVariants((v) => v.map((item, idx) => idx === i ? { ...item, [field]: value } : item))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (variants.some((v) => !v.name || !v.sku || !v.price)) {
      setError('All variant fields (name, SKU, price) are required.')
      return
    }
    setSaving(true)

    try {
      const slug = slugify(form.name)
      const basePrice = Math.min(...variants.map((v) => Number(v.price)))

      const { data: product, error: productError } = await (supabase as any)
        .from('products')
        .insert({
          name: form.name, slug, brand: form.brand,
          category: form.category as any, description: form.description,
          base_price: basePrice, is_featured: form.is_featured, is_active: true,
        })
        .select()
        .single()

      if (productError) { setError(productError.message); return }

      const variantInserts = variants.map((v) => ({
        product_id: product.id, name: v.name, sku: v.sku, price: Number(v.price),
      }))

      const { error: variantError, data: insertedVariants } = await (supabase.from('product_variants') as any)
        .insert(variantInserts).select('id')

      if (variantError) { setError(variantError.message); return }

      if (insertedVariants && insertedVariants.length > 0) {
        const inventoryRows = insertedVariants.flatMap((v: any, idx: number) => [
          { variant_id: v.id, branch_id: 'osu', quantity: parseInt(variants[idx]?.stockOsu ?? '0') || 0, low_stock_threshold: 5 },
          { variant_id: v.id, branch_id: 'east-legon', quantity: parseInt(variants[idx]?.stockEastLegon ?? '0') || 0, low_stock_threshold: 5 },
        ])
        await (supabase.from('inventory') as any).insert(inventoryRows)
      }

      router.push('/admin/products')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: 'white',
    border: '1px solid #D4C5B8', borderRadius: '4px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px',
    color: '#2C2420', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic', fontSize: '12px', color: '#B76E79', marginBottom: '5px',
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="flex items-center gap-1.5"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#8C7B74', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '28px', color: '#2C2420' }}>
          New Product
        </h1>
      </div>

      {error && (
        <div className="mb-5 p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#DC2626' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Basic info */}
        <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420', marginBottom: '16px' }}>
            Product Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label style={labelStyle}>Product Name *</label>
              <input required value={form.name} onChange={set('name')}
                placeholder="e.g. Hyaluronic Acid 2% + B5" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Brand *</label>
              <input required value={form.brand} onChange={set('brand')}
                placeholder="e.g. The Ordinary" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category *</label>
              <select required value={form.category} onChange={set('category')}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label style={labelStyle}>Description</label>
              <textarea value={form.description} onChange={set('description')} rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="Product description..." />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="featured" checked={form.is_featured}
                onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                style={{ accentColor: '#B76E79', width: '16px', height: '16px' }} />
              <label htmlFor="featured"
                style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', cursor: 'pointer' }}>
                Mark as Featured
              </label>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420' }}>
              Variants & Stock
            </h2>
            <button type="button" onClick={addVariant} className="flex items-center gap-1.5"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#B76E79', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Plus size={14} /> Add Variant
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {variants.map((v, i) => (
              <div key={i} className="p-4 flex flex-col gap-3"
                style={{ background: '#FAF7F4', borderRadius: '4px', border: '1px solid #E8DDD4' }}>

                {/* Row header */}
                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#B76E79' }}>
                    Variant {i + 1}
                  </span>
                  {variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Jost', sans-serif", fontSize: '11px' }}>
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>

                {/* Name + SKU + Price */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label style={labelStyle}>Name / Shade / Size *</label>
                    <input required value={v.name}
                      onChange={(e) => updateVariant(i, 'name', e.target.value)}
                      placeholder="e.g. 30ml" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>SKU *</label>
                    <input required value={v.sku}
                      onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                      placeholder="e.g. ORD-HA-030" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Price (GHS) *</label>
                    <input required type="number" min="0" step="0.01" value={v.price}
                      onChange={(e) => updateVariant(i, 'price', e.target.value)}
                      placeholder="0.00" style={inputStyle} />
                  </div>
                </div>

                {/* Stock per branch */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ ...labelStyle, color: '#8C7B74' }}>
                      Stock — Osu Branch
                    </label>
                    <input type="number" min="0" value={v.stockOsu}
                      onChange={(e) => updateVariant(i, 'stockOsu', e.target.value)}
                      placeholder="0" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: '#8C7B74' }}>
                      Stock — East Legon Branch
                    </label>
                    <input type="number" min="0" value={v.stockEastLegon}
                      onChange={(e) => updateVariant(i, 'stockEastLegon', e.target.value)}
                      placeholder="0" style={inputStyle} />
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          style={{ padding: '13px', background: saving ? '#8C7B74' : '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', letterSpacing: '0.06em', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', borderRadius: '4px' }}>
          {saving ? 'Saving…' : 'Save Product'}
        </button>

      </form>
    </div>
  )
}
