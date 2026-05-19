'use client'

import { useState } from 'react'
import { Image, ChevronDown, ChevronUp, Upload, Check, X, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PageContent {
  id: string
  page_key: string
  page_title: string
  banner_image_url: string | null
  banner_eyebrow: string | null
  banner_title: string | null
  banner_subtitle: string | null
  banner_cta_text: string | null
  banner_cta_href: string | null
}

const PAGE_LINKS: Record<string, string> = {
  home: '/', shop: '/shop', about: '/about', contact: '/contact',
  faq: '/faq', locations: '/locations', privacy: '/privacy',
  returns: '/returns', shipping: '/shipping', terms: '/terms',
}

export function ContentClient({ pages }: { pages: PageContent[] }) {
  const [expandedPage, setExpandedPage] = useState<string | null>('home')
  const [forms, setForms] = useState<Record<string, PageContent>>(
    Object.fromEntries(pages.map((p) => [p.page_key, { ...p }]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const supabase = createClient()

  const updateField = (pageKey: string, field: keyof PageContent, value: string) => {
    setForms((prev) => ({ ...prev, [pageKey]: { ...prev[pageKey], [field]: value } }))
  }

  const handleSave = async (pageKey: string) => {
    setSaving(pageKey)
    const form = forms[pageKey]
    await (supabase.from('page_content') as any)
      .update({
        banner_eyebrow: form.banner_eyebrow,
        banner_title: form.banner_title,
        banner_subtitle: form.banner_subtitle,
        banner_cta_text: form.banner_cta_text,
        banner_cta_href: form.banner_cta_href,
        banner_image_url: form.banner_image_url,
      })
      .eq('page_key', pageKey)
    setSaving(null)
    setSaved(pageKey)
    setTimeout(() => setSaved(null), 2500)
  }

  const handleImageUpload = async (pageKey: string, file: File) => {
    if (!file) return

    // Validate
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Max size is 5MB.')
      return
    }

    setUploading(pageKey)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const path = `${pageKey}/banner-${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('page-banners')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (error) {
      alert(`Upload failed: ${error.message}\n\nMake sure you ran supabase-phase7b.sql in your Supabase SQL Editor.`)
      setUploading(null)
      return
    }

    if (data) {
      const { data: urlData } = supabase.storage
        .from('page-banners')
        .getPublicUrl(data.path)
      updateField(pageKey, 'banner_image_url', urlData.publicUrl)
    }
    setUploading(null)
  }

  const handleRemoveImage = async (pageKey: string) => {
    updateField(pageKey, 'banner_image_url', '')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px',
    color: '#2C2420', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic', fontSize: '12px',
    color: '#B76E79', marginBottom: '5px',
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>
          Page Content
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
          Edit banner images and text for every page on the website.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {pages.map((page) => {
          const form = forms[page.page_key]
          const isExpanded = expandedPage === page.page_key
          const isSaving = saving === page.page_key
          const isSaved = saved === page.page_key
          const isUploading = uploading === page.page_key

          return (
            <div key={page.page_key}
              style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>

              {/* Accordion header */}
              <button
                onClick={() => setExpandedPage(isExpanded ? null : page.page_key)}
                className="w-full flex items-center justify-between p-5"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div className="flex items-center gap-3">
                  {form.banner_image_url ? (
                    <img src={form.banner_image_url} alt=""
                      className="w-10 h-10 object-cover"
                      style={{ borderRadius: '4px', border: '1px solid #E8DDD4' }} />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center"
                      style={{ background: '#F2EDE8', borderRadius: '4px' }}>
                      <Image size={16} color="#D4C5B8" />
                    </div>
                  )}
                  <div className="text-left">
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '17px', color: '#2C2420' }}>
                      {page.page_title}
                    </p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
                      {form.banner_image_url ? '✓ Has banner image' : 'No banner image'}
                      {' · '}
                      {form.banner_title || 'No title set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a href={PAGE_LINKS[page.page_key]} target="_blank" rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#B76E79', display: 'flex', alignItems: 'center' }}>
                    <ExternalLink size={14} />
                  </a>
                  {isExpanded ? <ChevronUp size={16} color="#8C7B74" /> : <ChevronDown size={16} color="#8C7B74" />}
                </div>
              </button>

              {/* Accordion body */}
              {isExpanded && (
                <div className="flex flex-col gap-6 px-5 pb-6"
                  style={{ borderTop: '1px solid #F2EDE8' }}>

                  {/* Banner image upload */}
                  <div className="pt-4">
                    <label style={labelStyle}>Banner Image</label>
                    <div className="flex flex-col gap-3">
                      {/* Preview */}
                      {form.banner_image_url ? (
                        <div className="relative">
                          <img src={form.banner_image_url} alt="Banner preview"
                            className="w-full object-cover"
                            style={{ height: '160px', borderRadius: '4px', border: '1px solid #E8DDD4' }} />
                          <button
                            onClick={() => handleRemoveImage(page.page_key)}
                            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center"
                            style={{ background: 'rgba(44,36,32,0.7)', borderRadius: '50%', border: 'none', cursor: 'pointer', color: 'white' }}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col items-center justify-center gap-2 py-8"
                          style={{ background: '#FAF7F4', border: '2px dashed #D4C5B8', borderRadius: '4px' }}>
                          <Image size={24} color="#D4C5B8" />
                          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#C4B8B2' }}>
                            No banner image — upload one below
                          </span>
                        </div>
                      )}

                      {/* Upload button */}
                      <label className="flex items-center gap-2 self-start px-4 py-2 cursor-pointer"
                        style={{ background: '#F2EDE8', border: '1px solid #D4C5B8', borderRadius: '4px', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#2C2420' }}>
                        <Upload size={14} color="#B76E79" />
                        {isUploading ? 'Uploading...' : form.banner_image_url ? 'Change Image' : 'Upload Image'}
                        <input type="file" accept="image/*" className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(page.page_key, file)
                          }} />
                      </label>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#C4B8B2' }}>
                        Recommended: 1920×600px, JPG or PNG, under 2MB
                      </p>
                    </div>
                  </div>

                  {/* Text fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Eyebrow Text</label>
                      <input value={form.banner_eyebrow ?? ''} style={inputStyle}
                        onChange={(e) => updateField(page.page_key, 'banner_eyebrow', e.target.value)}
                        placeholder="e.g. Our Story"
                        onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                        onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                    </div>
                    <div>
                      <label style={labelStyle}>Banner Title</label>
                      <input value={form.banner_title ?? ''} style={inputStyle}
                        onChange={(e) => updateField(page.page_key, 'banner_title', e.target.value)}
                        placeholder="Main heading"
                        onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                        onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                    </div>
                    <div className="sm:col-span-2">
                      <label style={labelStyle}>Subtitle / Description</label>
                      <textarea value={form.banner_subtitle ?? ''} rows={2}
                        style={{ ...inputStyle, resize: 'vertical' }}
                        onChange={(e) => updateField(page.page_key, 'banner_subtitle', e.target.value)}
                        placeholder="Short description shown under the title"
                        onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                        onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                    </div>
                    <div>
                      <label style={labelStyle}>CTA Button Text</label>
                      <input value={form.banner_cta_text ?? ''} style={inputStyle}
                        onChange={(e) => updateField(page.page_key, 'banner_cta_text', e.target.value)}
                        placeholder="e.g. Shop Now"
                        onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                        onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                    </div>
                    <div>
                      <label style={labelStyle}>CTA Button Link</label>
                      <input value={form.banner_cta_href ?? ''} style={inputStyle}
                        onChange={(e) => updateField(page.page_key, 'banner_cta_href', e.target.value)}
                        placeholder="e.g. /shop"
                        onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                        onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                    </div>
                  </div>

                  {/* Save button */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleSave(page.page_key)} disabled={isSaving}
                      className="flex items-center gap-2"
                      style={{
                        padding: '10px 24px',
                        background: isSaved ? '#16A34A' : '#2C2420',
                        color: 'white', border: 'none', borderRadius: '4px',
                        fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                        fontSize: '15px', letterSpacing: '0.04em',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s',
                      }}>
                      {isSaved
                        ? <><Check size={14} /> Saved!</>
                        : isSaving ? 'Saving...' : 'Save Changes'
                      }
                    </button>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#C4B8B2' }}>
                      Changes go live immediately
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
