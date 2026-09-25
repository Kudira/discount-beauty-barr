'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, Plus, Trash2, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateProduct, createVariant, updateVariant, createInventoryRows, logActivity } from '@/lib/actions'
import { slugify } from '@/lib/utils'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

const CATEGORIES = PRODUCT_CATEGORIES
const BUCKET = 'product-images'

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      width: '20px', height: '20px',
      border: '2px solid #E8DDD4',
      borderTopColor: '#B76E79',
      borderRadius: '50%',
      animation: 'dbb-spin 0.7s linear infinite',
    }} />
  )
}

// ── Image slot ────────────────────────────────────────────────────────────────
function ImageSlot({
  src, idx, isPrimary, isUploading, onUpload, onRemove,
}: {
  src: string
  idx: number
  isPrimary?: boolean
  isUploading: boolean
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  return (
    <div style={{
      position: 'relative', aspectRatio: '1/1',
      border: '1px solid #E8DDD4', borderRadius: '4px',
      overflow: 'hidden', background: '#FAF7F4',
    }}>
      <style>{`@keyframes dbb-spin { to { transform: rotate(360deg) } }`}</style>

      {src ? (
        <>
          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {isPrimary && (
            <span style={{
              position: 'absolute', top: '4px', left: '4px',
              background: '#B76E79', color: 'white',
              fontFamily: "'Jost', sans-serif", fontSize: '9px',
              padding: '2px 6px', borderRadius: '2px',
            }}>Primary</span>
          )}
          <button onClick={onRemove} style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '22px', height: '22px', borderRadius: '50%',
            background: 'rgba(44,36,32,0.75)', border: 'none',
            cursor: 'pointer', color: 'white', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={11} />
          </button>
        </>
      ) : isUploading ? (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Spinner />
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '9px', color: '#B76E79' }}>Uploading…</span>
        </div>
      ) : (
        <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
          <Upload size={16} color="#D4C5B8" />
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: '#C4B8B2' }}>Upload</span>
          <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
        </label>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ProductEditClient({ product }: { product: any }) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    name: product.name ?? '',
    brand: product.brand ?? '',
    category: product.category ?? 'skincare',
    description: product.description ?? '',
    is_featured: product.is_featured ?? false,
    is_active: product.is_active ?? true,
  })

  const [images, setImages] = useState<string[]>(product.images ?? [])
  const [uploadingProd, setUploadingProd] = useState<number | null>(null)

  const [variants, setVariants] = useState<any[]>(
    (product.product_variants ?? []).map((v: any) => ({
      id: v.id, name: v.name, sku: v.sku, price: String(v.price),
      images: v.images ?? [], isNew: false, uploadingImg: null as number | null,
    }))
  )

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [uploadMsg, setUploadMsg] = useState<{ type: 'error' | 'info'; text: string } | null>(null)

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }))

  // ── Core upload function ────────────────────────────────────────────────────
  const doUpload = async (file: File, storagePath: string): Promise<string | null> => {
    setUploadMsg(null)

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg({ type: 'error', text: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 5MB.` })
      return null
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUploadMsg({ type: 'error', text: `Invalid file type "${file.type}". Use JPG, PNG or WebP.` })
      return null
    }

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${storagePath}/${Date.now()}.${ext}`

      console.log('[DBB Upload] Starting upload to:', BUCKET, path)

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600',
        })

      if (uploadError) {
        console.error('[DBB Upload] Error:', uploadError)
        setUploadMsg({
          type: 'error',
          text: `Upload failed: ${uploadError.message}. Run supabase-phase7b.sql in your Supabase SQL Editor and make sure you are signed in.`,
        })
        return null
      }

      console.log('[DBB Upload] Success:', data.path)

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(data.path)

      console.log('[DBB Upload] Public URL:', urlData.publicUrl)
      setUploadMsg({ type: 'info', text: 'Image uploaded. Click "Save All Changes" to save.' })
      return urlData.publicUrl

    } catch (err: any) {
      console.error('[DBB Upload] Exception:', err)
      setUploadMsg({ type: 'error', text: `Upload error: ${err?.message ?? 'Unknown error'}` })
      return null
    }
  }

  // ── Product image upload ────────────────────────────────────────────────────
  const uploadProductImage = async (file: File, idx: number) => {
    setUploadingProd(idx)
    try {
      const url = await doUpload(file, `products/${product.id}`)
      if (url) {
        setImages((prev) => {
          const next = [...prev]
          // If slot already exists replace it, otherwise push
          if (idx < next.length) { next[idx] = url } else { next.push(url) }
          return next
        })
      }
    } finally {
      setUploadingProd(null)
    }
  }

  const addProductImageSlot = () => setImages((p) => [...p, ''])
  const removeProductImage = (idx: number) => setImages((p) => p.filter((_, i) => i !== idx))

  // ── Variant image upload ────────────────────────────────────────────────────
  const uploadVariantImage = async (variantIdx: number, file: File, imgIdx: number) => {
    setVariants((prev) => prev.map((v, i) =>
      i === variantIdx ? { ...v, uploadingImg: imgIdx } : v
    ))
    try {
      const variantId = variants[variantIdx].id ?? `new-${variantIdx}`
      const url = await doUpload(file, `products/${product.id}/variants/${variantId}`)
      if (url) {
        setVariants((prev) => prev.map((v, i) => {
          if (i !== variantIdx) return v
          const imgs = [...(v.images ?? [])]
          if (imgIdx < imgs.length) { imgs[imgIdx] = url } else { imgs.push(url) }
          return { ...v, images: imgs }
        }))
      }
    } finally {
      setVariants((prev) => prev.map((v, i) =>
        i === variantIdx ? { ...v, uploadingImg: null } : v
      ))
    }
  }

  const addVariantImageSlot = (vi: number) =>
    setVariants((p) => p.map((v, i) => i === vi ? { ...v, images: [...(v.images ?? []), ''] } : v))

  const removeVariantImage = (vi: number, ii: number) =>
    setVariants((p) => p.map((v, i) =>
      i === vi ? { ...v, images: (v.images ?? []).filter((_: any, idx: number) => idx !== ii) } : v
    ))

  // ── Variant management ──────────────────────────────────────────────────────
  const addVariant = () =>
    setVariants((v) => [...v, { id: null, name: '', sku: '', price: '', images: [], isNew: true, uploadingImg: null }])

  const removeVariant = (idx: number) => setVariants((v) => v.filter((_, i) => i !== idx))

  const updateVariant = (idx: number, field: string, value: string) =>
    setVariants((v) => v.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError('')
    if (!form.name || !form.brand) { setError('Name and brand are required.'); return }
    setSaving(true)

    try {
      const cleanImages = images.filter(Boolean)
      const slug = slugify(form.name)
      const prices = variants.map((v) => Number(v.price)).filter(Boolean)
      const basePrice = prices.length > 0 ? Math.min(...prices) : 0

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          product: {
            name: form.name, slug, brand: form.brand,
            category: form.category, description: form.description,
            is_featured: form.is_featured, is_active: form.is_active,
            images: cleanImages, base_price: basePrice,
          },
          variants: variants.map((v) => ({
            ...v, images: (v.images ?? []).filter(Boolean),
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Save failed'); return }

      setSaved(true)
      setTimeout(() => { setSaved(false); router.refresh() }, 2000)
    } catch (err: any) {
      setError(err?.message ?? 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
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
  const cardStyle: React.CSSProperties = {
    background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px',
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="flex items-center gap-1.5"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#8C7B74', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Products
        </Link>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '28px', color: '#2C2420' }}>
          Edit: {product.name}
        </h1>
      </div>

      {/* Error messages */}
      {error && (
        <div className="p-4 flex items-start gap-3"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>
          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#DC2626' }}>{error}</p>
        </div>
      )}

      {uploadMsg && (
        <div className="p-4 flex items-start gap-3"
          style={{
            background: uploadMsg.type === 'error' ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${uploadMsg.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
            borderRadius: '4px',
          }}>
          <AlertCircle size={16} color={uploadMsg.type === 'error' ? '#DC2626' : '#16A34A'} style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: uploadMsg.type === 'error' ? '#DC2626' : '#16A34A', lineHeight: 1.6 }}>
            {uploadMsg.text}
          </p>
        </div>
      )}

      {/* ── Product Images ─────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420', marginBottom: '6px' }}>
          Product Images
        </h2>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', marginBottom: '14px' }}>
          First image is the primary shown on the store. JPG, PNG or WebP · Max 5MB each.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((src, idx) => (
            <ImageSlot key={idx} src={src} idx={idx}
              isPrimary={idx === 0}
              isUploading={uploadingProd === idx}
              onUpload={(file) => uploadProductImage(file, idx)}
              onRemove={() => removeProductImage(idx)} />
          ))}
          <button onClick={addProductImageSlot} type="button"
            className="flex flex-col items-center justify-center gap-1"
            style={{ aspectRatio: '1/1', border: '2px dashed #D4C5B8', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }}>
            <Plus size={16} color="#D4C5B8" />
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: '#C4B8B2' }}>Add</span>
          </button>
        </div>
      </div>

      {/* ── Product Details ─────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420', marginBottom: '16px' }}>
          Product Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label style={labelStyle}>Product Name *</label>
            <input value={form.name} onChange={set('name')} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
              onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
          </div>
          <div>
            <label style={labelStyle}>Brand *</label>
            <input value={form.brand} onChange={set('brand')} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
              onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={form.category} onChange={set('category')}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
              onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
          </div>
          <div className="flex items-center gap-6">
            {[
              { field: 'is_featured', label: 'Featured' },
              { field: 'is_active', label: 'Active (visible on store)' },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox"
                  checked={form[field as keyof typeof form] as boolean}
                  onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.checked }))}
                  style={{ accentColor: '#B76E79', width: '16px', height: '16px' }} />
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420' }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* ── Variants ────────────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420' }}>
            Variants
          </h2>
          <button type="button" onClick={addVariant} className="flex items-center gap-1.5"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#B76E79', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Plus size={14} /> Add Variant
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {variants.map((v, vi) => (
            <div key={vi} style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '16px' }}>

              {/* Variant header */}
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', color: '#2C2420' }}>
                  {v.name || `Variant ${vi + 1}`}
                  {v.isNew && (
                    <span style={{ marginLeft: '8px', fontFamily: "'Jost', sans-serif", fontSize: '10px', color: '#B76E79', background: '#FDF5F6', padding: '1px 6px', borderRadius: '99px' }}>
                      New
                    </span>
                  )}
                </span>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(vi)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={13} />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px' }}>Remove</span>
                  </button>
                )}
              </div>

              {/* Fields */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div>
                  <label style={labelStyle}>Name / Shade / Size</label>
                  <input value={v.name} onChange={(e) => updateVariant(vi, 'name', e.target.value)}
                    placeholder="e.g. 30ml" style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                    onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                </div>
                <div>
                  <label style={labelStyle}>SKU</label>
                  <input value={v.sku} onChange={(e) => updateVariant(vi, 'sku', e.target.value)}
                    placeholder="e.g. ORD-030" style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                    onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                </div>
                <div>
                  <label style={labelStyle}>Price (GHS)</label>
                  <input type="number" min="0" step="0.01" value={v.price}
                    onChange={(e) => updateVariant(vi, 'price', e.target.value)} style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                    onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                </div>
              </div>

              {/* Variant images */}
              <div>
                <label style={{ ...labelStyle, marginBottom: '10px' }}>
                  Variant Images
                  <span style={{ color: '#C4B8B2', marginLeft: '6px', fontStyle: 'normal' }}>
                    (shade swatches, colour shots, etc.)
                  </span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {(v.images ?? []).map((src: string, ii: number) => (
                    <ImageSlot key={ii} src={src} idx={ii}
                      isPrimary={false}
                      isUploading={v.uploadingImg === ii}
                      onUpload={(file) => uploadVariantImage(vi, file, ii)}
                      onRemove={() => removeVariantImage(vi, ii)} />
                  ))}
                  <button onClick={() => addVariantImageSlot(vi)} type="button"
                    className="flex flex-col items-center justify-center gap-1"
                    style={{ aspectRatio: '1/1', border: '2px dashed #D4C5B8', borderRadius: '4px', background: 'transparent', cursor: 'pointer' }}>
                    <Plus size={14} color="#D4C5B8" />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '9px', color: '#C4B8B2' }}>Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Save ───────────────────────────────────────────────────────────── */}
      <button onClick={handleSave} disabled={saving}
        className="flex items-center justify-center gap-2"
        style={{
          padding: '15px', border: 'none', borderRadius: '4px',
          cursor: saving ? 'not-allowed' : 'pointer',
          background: saved ? '#16A34A' : saving ? '#8C7B74' : '#2C2420',
          color: 'white', fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic', fontSize: '17px', letterSpacing: '0.06em',
          transition: 'background 0.2s',
        }}>
        {saved ? <><Check size={16} /> Saved!</>
          : saving ? 'Saving…'
          : 'Save All Changes'}
      </button>
    </div>
  )
}
