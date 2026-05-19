'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { PageHero } from '@/components/shared/PageHero'
import { User, Package, LogOut, Edit2, Check, Heart, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Tab = 'profile' | 'orders' | 'wishlist'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: '#92400E', bg: '#FEF3C7' },
  confirmed:  { label: 'Confirmed',  color: '#1D4ED8', bg: '#EFF6FF' },
  processing: { label: 'Processing', color: '#5B21B6', bg: '#F5F3FF' },
  ready:      { label: 'Ready',      color: '#065F46', bg: '#D1FAE5' },
  delivered:  { label: 'Delivered',  color: '#14532D', bg: '#F0FDF4' },
  cancelled:  { label: 'Cancelled',  color: '#991B1B', bg: '#FEF2F2' },
  refunded:   { label: 'Refunded',   color: '#6B7280', bg: '#F3F4F6' },
}

export function AccountClient() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('profile')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' })

  // Orders state
  const [orders, setOrders] = useState<any[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Wishlist state
  const [wishlist, setWishlist] = useState<any[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)

  const handleSignOut = async () => { await signOut(); router.push('/') }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await (supabase.from('profiles') as any).update({ full_name: form.full_name, phone: form.phone }).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setEditing(false)
  }

  const loadOrders = async () => {
    if (!user || ordersLoading) return
    setOrdersLoading(true)
    const { data } = await (supabase as any)
      .from('orders')
      .select('id, order_number, status, total, fulfillment, created_at, order_items(product_name, quantity)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setOrdersLoading(false)
  }

  const loadWishlist = async () => {
    if (!user || wishlistLoading) return
    setWishlistLoading(true)
    const { data } = await (supabase as any)
      .from('wishlists')
      .select('id, product_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setWishlist(data ?? [])
    setWishlistLoading(false)
  }

  const removeFromWishlist = async (id: string) => {
    await (supabase as any).from('wishlists').delete().eq('id', id)
    setWishlist((p) => p.filter((w) => w.id !== id))
  }

  useEffect(() => {
    if (tab === 'orders') loadOrders()
    if (tab === 'wishlist') loadWishlist()
  }, [tab])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: 'white',
    border: '1px solid #D4C5B8', borderRadius: '2px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#2C2420', outline: 'none',
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic', fontSize: '15px', letterSpacing: '0.06em',
    color: active ? '#B76E79' : '#8C7B74', background: 'none', border: 'none',
    borderBottom: active ? '2px solid #B76E79' : '2px solid transparent',
    cursor: 'pointer', transition: 'all 0.2s',
  })

  return (
    <>
      <PageHero eyebrow="My Account" title={`Hello, ${profile?.full_name?.split(' ')[0] || 'Beauty'} ✦`} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Tabs */}
        <div className="flex gap-0 mb-8 overflow-x-auto" style={{ borderBottom: '1px solid #E8DDD4' }}>
          <button style={tabStyle(tab === 'profile')} onClick={() => setTab('profile')}>
            <User className="w-4 h-4 inline mr-2" /> Profile
          </button>
          <button style={tabStyle(tab === 'orders')} onClick={() => setTab('orders')}>
            <Package className="w-4 h-4 inline mr-2" /> Orders
          </button>
          <button style={tabStyle(tab === 'wishlist')} onClick={() => setTab('wishlist')}>
            <Heart className="w-4 h-4 inline mr-2" /> Wishlist
          </button>
          <button onClick={handleSignOut} className="ml-auto flex items-center gap-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#8C7B74', background: 'none', border: 'none', cursor: 'pointer', paddingBottom: '10px', whiteSpace: 'nowrap' }}>
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* ── Profile ── */}
        {tab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-5 p-6" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
              <div className="flex items-center justify-between">
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '22px', color: '#2C2420' }}>Personal Details</h2>
                <button onClick={() => editing ? handleSave() : setEditing(true)} disabled={saving}
                  className="flex items-center gap-1.5"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#B76E79', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {editing ? <><Check className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Save'}</> : <><Edit2 className="w-3.5 h-3.5" /> Edit</>}
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {[
                  { label: 'Full Name', field: 'full_name', value: profile?.full_name, editable: true },
                  { label: 'Email', field: 'email', value: user?.email, editable: false },
                  { label: 'Phone', field: 'phone', value: profile?.phone, editable: true },
                ].map(({ label, field, value, editable }) => (
                  <div key={field}>
                    <label style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: '#B76E79', display: 'block', marginBottom: '4px' }}>{label}</label>
                    {editing && editable ? (
                      <input value={form[field as keyof typeof form] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                        style={inputStyle}
                        onFocus={(e) => (e.target.style.borderColor = '#B76E79')} onBlur={(e) => (e.target.style.borderColor = '#D4C5B8')} />
                    ) : (
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#2C2420' }}>{value || '—'}</p>
                    )}
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: '#B76E79', display: 'block', marginBottom: '4px' }}>Account Type</label>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#B76E79', background: '#FDF5F6', padding: '2px 10px', borderRadius: '2px', border: '1px solid #F2CFC3', textTransform: 'capitalize' }}>
                    {profile?.role ?? 'Customer'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {tab === 'orders' && (
          <div className="flex flex-col gap-4">
            {ordersLoading ? (
              <div className="text-center py-12">
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>Loading orders…</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <Package className="w-12 h-12" style={{ color: '#D4C5B8' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '22px', color: '#2C2420' }}>No Orders Yet</h3>
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', maxWidth: '280px', lineHeight: 1.7 }}>
                  Your order history will appear here once you&apos;ve placed your first order.
                </p>
                <Link href="/shop" style={{ padding: '12px 28px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', textDecoration: 'none', borderRadius: '2px' }}>
                  Shop Now
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const s = statusConfig[order.status] ?? statusConfig.pending
                return (
                  <div key={order.id} className="flex flex-col gap-3 p-5" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420' }}>{order.order_number}</p>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', marginTop: '2px' }}>
                          {new Date(order.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' · '}{order.fulfillment}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: s.color, background: s.bg, padding: '3px 10px', borderRadius: '99px' }}>
                          {s.label}
                        </span>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420' }}>
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                    {order.order_items?.length > 0 && (
                      <div>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
                          {order.order_items.map((i: any) => `${i.product_name} ×${i.quantity}`).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Wishlist ── */}
        {tab === 'wishlist' && (
          <div className="flex flex-col gap-4">
            {wishlistLoading ? (
              <div className="text-center py-12">
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>Loading wishlist…</p>
              </div>
            ) : wishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <Heart className="w-12 h-12" style={{ color: '#D4C5B8' }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '22px', color: '#2C2420' }}>Your Wishlist is Empty</h3>
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', maxWidth: '280px', lineHeight: 1.7 }}>
                  Tap the heart icon on any product to save it here.
                </p>
                <Link href="/shop" style={{ padding: '12px 28px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', textDecoration: 'none', borderRadius: '2px' }}>
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wishlist.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4"
                    style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '2px' }}>
                    <div>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420' }}>
                        Product ID: {item.product_id}
                      </p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
                        Saved {new Date(item.created_at).toLocaleDateString('en-GH')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/shop`} style={{ display: 'flex', alignItems: 'center', color: '#B76E79' }}>
                        <ExternalLink size={14} />
                      </Link>
                      <button onClick={() => removeFromWishlist(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }}>
                        <Heart size={14} style={{ fill: '#DC2626' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
