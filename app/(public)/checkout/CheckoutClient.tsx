'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Package, Tag, AlertCircle } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { CartSummary } from '@/components/cart/CartSummary'
import { EmptyCart } from '@/components/cart/EmptyCart'
import { BRANCHES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Fulfillment = 'delivery' | 'pickup'

interface CheckoutForm {
  firstName: string; lastName: string; email: string; phone: string
  address: string; city: string; notes: string
  branch: string; fulfillment: Fulfillment; promoCode: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: 'white',
  border: '1px solid #D4C5B8', borderRadius: '2px',
  fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px',
  color: '#2C2420', outline: 'none',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'Cormorant Garamond', serif",
  fontStyle: 'italic', fontSize: '13px', letterSpacing: '0.06em',
  color: '#8C7B74', marginBottom: '6px',
}

export function CheckoutClient() {
  const { items, subtotal, deliveryFee: cartDeliveryFee } = useCart()
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [form, setForm] = useState<CheckoutForm>({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: 'Accra', notes: '',
    branch: 'osu', fulfillment: 'delivery', promoCode: '',
  })

  useEffect(() => {
    if (user || profile) {
      setForm((prev) => ({
        ...prev,
        firstName: prev.firstName || profile?.full_name?.split(' ')[0] || '',
        lastName: prev.lastName || profile?.full_name?.split(' ').slice(1).join(' ') || '',
        email: prev.email || user?.email || '',
        phone: prev.phone || (profile as any)?.phone || '',
      }))
    }
  }, [user, profile])

  // Pickup is free; the server recalculates all of this before charging.
  const deliveryFee = form.fulfillment === 'pickup' ? 0 : cartDeliveryFee
  const finalTotal = Math.max(0, subtotal + deliveryFee - (promoApplied?.discount ?? 0))

  if (items.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"><EmptyCart /></div>
  )

  const set = (field: keyof CheckoutForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const applyPromo = async () => {
    if (!form.promoCode.trim()) return
    setPromoLoading(true); setPromoError('')
    try {
      const { data } = await (supabase as any)
        .from('promo_codes').select('*')
        .eq('code', form.promoCode.trim().toUpperCase())
        .eq('is_active', true).maybeSingle()
      if (!data) {
        setPromoError('Invalid or expired promo code.')
        setPromoApplied(null)
      } else {
        const discount = data.discount_type === 'percentage'
          ? (subtotal * data.discount_value) / 100
          : data.discount_value
        setPromoApplied({ code: data.code, discount: Math.min(discount, subtotal) })
      }
    } catch { setPromoError('Could not verify promo code.') }
    setPromoLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setPlacing(true)

    try {
      // The server prices the order from the database, saves it as pending,
      // and returns a Paystack payment page. The cart is cleared only after
      // payment is confirmed (on /checkout/verify).
      const res = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
          fulfillment: form.fulfillment,
          branch: form.branch,
          address: form.address,
          city: form.city,
          notes: form.notes,
          promoCode: promoApplied?.code ?? '',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.authorizationUrl) {
        throw new Error(json.error ?? 'Could not start payment. Please try again.')
      }
      window.location.href = json.authorizationUrl
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setPlacing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/cart" className="inline-flex items-center gap-1.5 mb-8 transition-colors"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#8C7B74', textDecoration: 'none' }}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
      </Link>

      {error && (
        <div className="mb-6 p-4 flex items-start gap-3"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>
          <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#DC2626' }}>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col gap-8">

          {/* Contact */}
          <div className="flex flex-col gap-5 p-6" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '22px', color: '#2C2420' }}>Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'First Name *', field: 'firstName', placeholder: 'Ama', type: 'text' },
                { label: 'Last Name *', field: 'lastName', placeholder: 'Mensah', type: 'text' },
                { label: 'Email Address *', field: 'email', placeholder: 'ama@email.com', type: 'email' },
                { label: 'Phone Number *', field: 'phone', placeholder: '+233 XX XXX XXXX', type: 'tel' },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label style={labelStyle}>{label}</label>
                  <input required type={type} value={form[field as keyof CheckoutForm] as string}
                    onChange={set(field as keyof CheckoutForm)} placeholder={placeholder} style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                    onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                </div>
              ))}
            </div>
          </div>

          {/* Fulfillment */}
          <div className="flex flex-col gap-5 p-6" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '22px', color: '#2C2420' }}>Delivery or Pickup?</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'delivery', label: 'Home Delivery', icon: <Package size={18} />, sub: cartDeliveryFee === 0 ? 'Free' : formatCurrency(cartDeliveryFee) },
                { value: 'pickup', label: 'Pick Up In Store', icon: <MapPin size={18} />, sub: 'Free' },
              ].map((opt) => (
                <button type="button" key={opt.value}
                  onClick={() => setForm((p) => ({ ...p, fulfillment: opt.value as Fulfillment }))}
                  className="flex flex-col items-center gap-2 p-4 transition-all"
                  style={{ border: form.fulfillment === opt.value ? '1px solid #B76E79' : '1px solid #D4C5B8', background: form.fulfillment === opt.value ? '#FDF5F6' : 'white', cursor: 'pointer', borderRadius: '2px' }}>
                  <span style={{ color: form.fulfillment === opt.value ? '#B76E79' : '#8C7B74' }}>{opt.icon}</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '15px', color: '#2C2420' }}>{opt.label}</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#B76E79' }}>{opt.sub}</span>
                </button>
              ))}
            </div>
            {form.fulfillment === 'delivery' && (
              <div className="flex flex-col gap-4">
                <div>
                  <label style={labelStyle}>Delivery Address *</label>
                  <input required value={form.address} onChange={set('address')}
                    placeholder="House number, street name, area" style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                    onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={form.city} onChange={set('city')} style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                    onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                </div>
              </div>
            )}
            {form.fulfillment === 'pickup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BRANCHES.map((branch) => (
                  <button type="button" key={branch.id}
                    onClick={() => setForm((p) => ({ ...p, branch: branch.id }))}
                    className="flex flex-col gap-1 p-4 text-left transition-all"
                    style={{ border: form.branch === branch.id ? '1px solid #B76E79' : '1px solid #D4C5B8', background: form.branch === branch.id ? '#FDF5F6' : 'white', cursor: 'pointer', borderRadius: '2px' }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '16px', color: '#2C2420' }}>{branch.name}</span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', lineHeight: 1.5 }}>{branch.address}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Promo */}
          <div className="flex flex-col gap-3 p-6" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '22px', color: '#2C2420' }}>Promo Code</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Tag size={14} color="#B76E79" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input value={form.promoCode} onChange={set('promoCode')} placeholder="Enter promo code"
                  style={{ ...inputStyle, paddingLeft: '36px', textTransform: 'uppercase' }}
                  onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
                  onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
              </div>
              <button type="button" onClick={applyPromo} disabled={promoLoading || !form.promoCode}
                style={{ padding: '11px 20px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', border: 'none', cursor: 'pointer', borderRadius: '2px', opacity: !form.promoCode ? 0.5 : 1 }}>
                {promoLoading ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {promoError && <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#DC2626' }}>{promoError}</p>}
            {promoApplied && (
              <div className="flex items-center justify-between p-3"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '2px' }}>
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#16A34A' }}>
                  ✓ Code <strong>{promoApplied.code}</strong> — saving {formatCurrency(promoApplied.discount)}
                </span>
                <button type="button" onClick={() => { setPromoApplied(null); setForm((p) => ({ ...p, promoCode: '' })) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7B74', fontSize: '12px' }}>Remove</button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-3 p-6" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '22px', color: '#2C2420' }}>
              Order Notes <span style={{ fontWeight: 300, fontSize: '16px', color: '#8C7B74' }}>(optional)</span>
            </h2>
            <textarea value={form.notes} onChange={set('notes')} rows={3}
              placeholder="Any special instructions…" style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={(e) => (e.target.style.borderColor = '#B76E79')}
              onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
          </div>

          <button type="submit" disabled={placing}
            style={{ padding: '16px', background: placing ? '#8C7B74' : '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', letterSpacing: '0.06em', border: 'none', cursor: placing ? 'not-allowed' : 'pointer', borderRadius: '2px', transition: 'background 0.2s' }}>
            {placing ? 'Opening secure payment…' : `Pay ${formatCurrency(finalTotal)}`}
          </button>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', textAlign: 'center', marginTop: '-20px' }}>
            You’ll pay by card or mobile money on Paystack’s secure page.
          </p>
        </form>

        <div className="lg:col-span-1">
          <div className="sticky top-24 flex flex-col gap-4">
            <CartSummary subtotal={subtotal} deliveryFee={deliveryFee} total={finalTotal} mode="checkout" />
            <div className="flex flex-col gap-3 p-5" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
              <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '16px', color: '#2C2420' }}>
                {items.length} Item{items.length !== 1 ? 's' : ''}
              </h4>
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#2C2420', lineHeight: 1.4 }} className="line-clamp-1">{item.name}</p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>{item.variantName} × {item.quantity}</p>
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', color: '#2C2420', flexShrink: 0 }}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
