'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Truck, MapPin, User, Mail, Phone, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { updateOrderStatus } from '@/lib/actions'
import { sendEmail } from '@/lib/email/sendEmail'
import { orderStatusUpdateTemplate } from '@/lib/email/templates'
import { formatCurrency } from '@/lib/utils'
import type { Order, OrderItem, OrderStatus } from '@/lib/supabase/types'

type OrderWithItems = Order & { order_items?: OrderItem[] | null }

const STATUS_OPTIONS: OrderStatus[] = ['pending','confirmed','processing','ready','delivered','cancelled','refunded']

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: '#92400E', bg: '#FEF3C7' },
  confirmed:  { label: 'Confirmed',  color: '#1D4ED8', bg: '#EFF6FF' },
  processing: { label: 'Processing', color: '#5B21B6', bg: '#F5F3FF' },
  ready:      { label: 'Ready',      color: '#065F46', bg: '#D1FAE5' },
  delivered:  { label: 'Delivered',  color: '#14532D', bg: '#F0FDF4' },
  cancelled:  { label: 'Cancelled',  color: '#991B1B', bg: '#FEF2F2' },
  refunded:   { label: 'Refunded',   color: '#6B7280', bg: '#F3F4F6' },
}

export function OrderDetailClient({ order }: { order: OrderWithItems }) {
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleStatusUpdate = async () => {
    if (status === order.status) return
    setError(''); setSaving(true)

    try {
      // Server action — bypasses RLS
      await updateOrderStatus(order.id, status)

      // Send email — track real success/failure
      if (order.customer_email) {
        try {
          const { subject, html } = orderStatusUpdateTemplate({
            customerName: order.customer_name?.split(' ')[0] ?? 'there',
            orderNumber: order.order_number,
            status,
          })
          const result = await sendEmail({ to: order.customer_email, subject, html, orderId: order.id, template: 'order_status' })
          setEmailSent(result)
        } catch {}
      }

      setSaved(true)
      setTimeout(() => { setSaved(false); router.refresh() }, 1500)
    } catch (err: any) {
      setError(err?.message ?? 'Update failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const sc = statusConfig[order.status] ?? statusConfig.pending

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Link href="/admin/orders" className="flex items-center gap-1.5"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#8C7B74', textDecoration: 'none' }}>
          <ArrowLeft size={14} /> All Orders
        </Link>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '28px', color: '#2C2420' }}>
          {order.order_number}
        </h1>
        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: sc.color, background: sc.bg, padding: '3px 12px', borderRadius: '99px' }}>
          {sc.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Items */}
          <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420', marginBottom: '16px' }}>Items</h2>
            <div className="flex flex-col gap-3">
              {(order.order_items ?? []).map((item: any) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '14px', color: '#2C2420' }}>{item.product_name}</p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
                      {item.brand} · {item.variant_name} · SKU: {item.sku} · Qty: {item.quantity}
                    </p>
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', color: '#2C2420', flexShrink: 0 }}>
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1 pt-4 mt-4" style={{ borderTop: '1px solid #E8DDD4' }}>
              <div className="flex justify-between">
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#8C7B74' }}>Subtotal</span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#2C2420' }}>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#16A34A' }}>Discount</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#16A34A' }}>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#8C7B74' }}>Delivery</span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#2C2420' }}>{order.delivery_fee === 0 ? 'Free' : formatCurrency(order.delivery_fee)}</span>
              </div>
              {Number(order.processing_fee ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#8C7B74' }}>Processing fee (1.95%)</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#2C2420' }}>{formatCurrency(Number(order.processing_fee))}</span>
                </div>
              )}
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid #F2EDE8' }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', color: '#2C2420', fontWeight: 400 }}>Total</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: '#2C2420', fontWeight: 400 }}>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment */}
          <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420', marginBottom: '12px' }}>Fulfillment</h2>
            <div className="flex items-start gap-2">
              {order.fulfillment === 'delivery'
                ? <Truck size={15} color="#B76E79" style={{ marginTop: '2px' }} />
                : <MapPin size={15} color="#B76E79" style={{ marginTop: '2px' }} />}
              <div>
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '14px', color: '#2C2420', textTransform: 'capitalize' }}>{order.fulfillment}</p>
                {order.fulfillment === 'delivery' && (order as any).delivery_address && (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
                    {(order as any).delivery_address}{(order as any).delivery_city ? `, ${(order as any).delivery_city}` : ''}
                  </p>
                )}
                {order.branch_id && (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74', textTransform: 'capitalize' }}>
                    Branch: {order.branch_id.replace('-', ' ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col gap-5">

          {/* Customer */}
          <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420', marginBottom: '12px' }}>Customer</h2>
            <div className="flex flex-col gap-2">
              {[
                { icon: <User size={13} />,  text: order.customer_name },
                { icon: <Mail size={13} />,  text: order.customer_email },
                { icon: <Phone size={13} />, text: (order as any).customer_phone || 'Not provided' },
                { icon: <Clock size={13} />, text: new Date(order.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span style={{ color: '#B76E79', flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', wordBreak: 'break-all' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status update */}
          <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#2C2420', marginBottom: '12px' }}>Update Status</h2>

            {error && (
              <div className="mb-3 p-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#DC2626' }}>{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', background: status === s ? (statusConfig[s]?.bg ?? '#F2EDE8') : 'white', border: `1px solid ${status === s ? (statusConfig[s]?.color ?? '#B76E79') + '40' : '#E8DDD4'}`, textAlign: 'left', width: '100%' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusConfig[s]?.color ?? '#8C7B74', flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: status === s ? 400 : 300, fontSize: '13px', color: statusConfig[s]?.color ?? '#2C2420' }}>
                    {statusConfig[s]?.label ?? s}
                  </span>
                  {order.status === s && <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: '#8C7B74', marginLeft: 'auto' }}>current</span>}
                </button>
              ))}
            </div>

            <button onClick={handleStatusUpdate} disabled={saving || status === order.status}
              style={{ width: '100%', marginTop: '12px', padding: '11px', background: saving ? '#8C7B74' : status === order.status ? '#E8DDD4' : '#2C2420', color: status === order.status ? '#8C7B74' : 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', border: 'none', borderRadius: '4px', cursor: saving || status === order.status ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s' }}>
              {saving
                ? <><div style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
                : saved ? <><CheckCircle size={14} /> Saved!</>
                : 'Save Status'}
            </button>
            {saved && order.customer_email && <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#16A34A', textAlign: 'center', marginTop: '6px' }}>✓ Status updated · Email notification sent</p>}
          </div>

          {order.notes && (
            <div style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '16px' }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#B76E79', marginBottom: '4px' }}>Notes</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', lineHeight: 1.6 }}>{order.notes}</p>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
