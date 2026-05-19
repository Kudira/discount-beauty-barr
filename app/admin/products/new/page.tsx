'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Wand2 } from 'lucide-react'
import { slugify } from '@/lib/utils'
import { createProduct, createVariant, createInventoryRows, logActivity } from '@/lib/actions'

const CATEGORIES = ['skincare','makeup','haircare','fragrance','tools','body']

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

interface Brand { id: string; name: string; sku_prefix: string }

function genSku(prefix: string, category: string, idx: number) {
  return `${prefix.toUpperCase()}-${category.slice(0,2).toUpperCase()}-${String(idx).padStart(3,'0')}`
}

export default function NewProductPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Brands
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [showNewBrand, setShowNewBrand] = useState(false)
  const [newBrandName, setNewBrandName] = useState('')
  const [newBrandPrefix, setNewBrandPrefix] = useState('')
  const [savingBrand, setSavingBrand] = useState(false)

  const [form, setForm] = useState({ name: '', brand: '', category: 'skincare', description: '', is_featured: false })
  const [variants, setVariants] = useState([{ name: '', sku: '', price: '', stockOsu: '0', stockEastLegon: '0' }])

  // Load brands
  useEffect(() => {
    fetch('/api/admin/brands').then(r => r.json()).then(d => setBrands(d.brands ?? [])).catch(() => {})
  }, [])

  const pickBrand = (brandName: string) => {
    const b = brands.find(b => b.name === brandName) ?? null
    setSelectedBrand(b)
    setForm(p => ({ ...p, brand: brandName }))
  }

  const addBrand = async () => {
    if (!newBrandName || !newBrandPrefix) return
    setSavingBrand(true)
    try {
      const res = await fetch('/api/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName, sku_prefix: newBrandPrefix }),
      })
      const { brand } = await res.json()
      if (brand) {
        setBrands(p => [...p, brand].sort((a,b) => a.name.localeCompare(b.name)))
        pickBrand(brand.name)
        setShowNewBrand(false)
        setNewBrandName('')
        setNewBrandPrefix('')
      }
    } catch {}
    setSavingBrand(false)
  }

  const autoFillSkus = () => {
    if (!selectedBrand) return
    setVariants(vs => vs.map((v, i) => ({ ...v, sku: genSku(selectedBrand.sku_prefix, form.category, i + 1) })))
  }

  const addVariant = () => {
    const sku = selectedBrand ? genSku(selectedBrand.sku_prefix, form.category, variants.length + 1) : ''
    setVariants(p => [...p, { name: '', sku, price: '', stockOsu: '0', stockEastLegon: '0' }])
  }

  const removeVariant = (i: number) => setVariants(p => p.filter((_,idx) => idx !== i))
  const updateVariant = (i: number, field: string, value: string) =>
    setVariants(p => p.map((v, idx) => idx === i ? { ...v, [field]: value } : v))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.brand) { setError('Please select a brand.'); return }
    if (variants.some(v => !v.name || !v.sku || !v.price)) {
      setError('All variant fields (name, SKU, price) are required.')
      return
    }
    setSaving(true)
    try {
      const product = await createProduct({
        name: form.name,
        slug: slugify(form.name),
        brand: form.brand,
        category: form.category,
        description: form.description,
        base_price: Math.min(...variants.map(v => Number(v.price))),
        is_featured: form.is_featured,
        is_active: true,
      })

      const inventoryRows: any[] = []
      for (const v of variants) {
        const variant = await createVariant({ product_id: product.id, name: v.name, sku: v.sku, price: Number(v.price) })
        inventoryRows.push(
          { variant_id: variant.id, branch_id: 'osu', quantity: parseInt(v.stockOsu) || 0, low_stock_threshold: 5 },
          { variant_id: variant.id, branch_id: 'east-legon', quantity: parseInt(v.stockEastLegon) || 0, low_stock_threshold: 5 },
        )
      }
      await createInventoryRows(inventoryRows)
      logActivity({ action: 'product.created', entity_type: 'product', entity_id: product.id, details: { name: form.name } }).catch(() => {})
      router.push('/admin/products')
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="flex items-center gap-1.5"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#8C7B74', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '28px', color: '#2C2420' }}>New Product</h1>
      </div>

      {error && (
        <div className="mb-5 p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#DC2626' }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Product details */}
        <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420', marginBottom: '16px' }}>
            Product Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label style={labelStyle}>Product Name *</label>
              <input required value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Hyaluronic Acid 2% + B5" style={inputStyle} />
            </div>

            {/* Brand */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Brand *</label>
                <button type="button" onClick={() => setShowNewBrand(p => !p)}
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '11px', color: '#B76E79', background: 'none', border: 'none', cursor: 'pointer' }}>
                  + New Brand
                </button>
              </div>
              <select required value={form.brand} onChange={e => pickBrand(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select brand…</option>
                {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
              {showNewBrand && (
                <div className="mt-2 p-3 flex flex-col gap-2"
                  style={{ background: '#FAF7F4', borderRadius: '4px', border: '1px solid #E8DDD4' }}>
                  <input value={newBrandName} onChange={e => setNewBrandName(e.target.value)}
                    placeholder="Brand name e.g. The Ordinary" style={{ ...inputStyle, fontSize: '12px' }} />
                  <div className="flex gap-2">
                    <input value={newBrandPrefix} onChange={e => setNewBrandPrefix(e.target.value.toUpperCase().slice(0,4))}
                      placeholder="SKU prefix e.g. ORD" maxLength={4}
                      style={{ ...inputStyle, fontSize: '12px', width: '110px' }} />
                    <button type="button" onClick={addBrand} disabled={savingBrand || !newBrandName || !newBrandPrefix}
                      style={{ flex: 1, padding: '8px', background: '#2C2420', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px' }}>
                      {savingBrand ? 'Adding…' : 'Add Brand'}
                    </button>
                  </div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#8C7B74' }}>
                    SKU prefix: 2–4 letters that identify this brand (e.g. ORD, LRP, MAC)
                  </p>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category *</label>
              <select required value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label style={labelStyle}>Description</label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Product description…" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="featured" checked={form.is_featured}
                onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))}
                style={{ accentColor: '#B76E79', width: '16px', height: '16px' }} />
              <label htmlFor="featured" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', cursor: 'pointer' }}>
                Mark as Featured
              </label>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420' }}>
              Variants & Stock
            </h2>
            <div className="flex items-center gap-3">
              {selectedBrand && (
                <button type="button" onClick={autoFillSkus}
                  className="flex items-center gap-1.5"
                  style={{ padding: '5px 10px', background: '#F2EDE8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#2C2420' }}>
                  <Wand2 size={12} /> Auto-fill SKUs
                </button>
              )}
              <button type="button" onClick={addVariant}
                className="flex items-center gap-1.5"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#B76E79', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Plus size={14} /> Add Variant
              </button>
            </div>
          </div>

          {selectedBrand && (
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74', marginBottom: '12px', background: '#FAF7F4', padding: '6px 10px', borderRadius: '4px' }}>
              SKU format for <strong>{selectedBrand.name}</strong>: {selectedBrand.sku_prefix}-{form.category.slice(0,2).toUpperCase()}-001
            </p>
          )}

          <div className="flex flex-col gap-4">
            {variants.map((v, i) => (
              <div key={i} className="p-4 flex flex-col gap-3"
                style={{ background: '#FAF7F4', borderRadius: '4px', border: '1px solid #E8DDD4' }}>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label style={labelStyle}>Name / Size / Shade *</label>
                    <input required value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)}
                      placeholder="e.g. 30ml" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>SKU *</label>
                    <input required value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)}
                      placeholder="e.g. ORD-SK-001" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Price (GHS) *</label>
                    <input required type="number" min="0" step="0.01" value={v.price}
                      onChange={e => updateVariant(i, 'price', e.target.value)}
                      placeholder="0.00" style={inputStyle} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={{ ...labelStyle, color: '#8C7B74' }}>Initial Stock — Osu</label>
                    <input type="number" min="0" value={v.stockOsu}
                      onChange={e => updateVariant(i, 'stockOsu', e.target.value)}
                      placeholder="0" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, color: '#8C7B74' }}>Initial Stock — East Legon</label>
                    <input type="number" min="0" value={v.stockEastLegon}
                      onChange={e => updateVariant(i, 'stockEastLegon', e.target.value)}
                      placeholder="0" style={inputStyle} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving}
          style={{ padding: '13px', background: saving ? '#8C7B74' : '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', letterSpacing: '0.06em', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', borderRadius: '4px', transition: 'background 0.2s' }}>
          {saving ? 'Saving Product…' : 'Save Product'}
        </button>
      </form>
    </div>
  )
}
