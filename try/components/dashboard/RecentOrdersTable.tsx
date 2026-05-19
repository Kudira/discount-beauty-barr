'use client'

import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled' | 'refunded'

interface OrderRow {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  status: OrderStatus
  total: number
  fulfillment: string
  created_at: string
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: '#92400E', bg: '#FEF3C7' },
  confirmed:  { label: 'Confirmed',  color: '#1D4ED8', bg: '#EFF6FF' },
  processing: { label: 'Processing', color: '#5B21B6', bg: '#F5F3FF' },
  ready:      { label: 'Ready',      color: '#065F46', bg: '#D1FAE5' },
  delivered:  { label: 'Delivered',  color: '#14532D', bg: '#F0FDF4' },
  cancelled:  { label: 'Cancelled',  color: '#991B1B', bg: '#FEF2F2' },
  refunded:   { label: 'Refunded',   color: '#6B7280', bg: '#F3F4F6' },
}

interface RecentOrdersTableProps {
  orders: OrderRow[]
  showViewAll?: boolean
}

export function RecentOrdersTable({ orders, showViewAll = true }: RecentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>
          No orders yet
        </p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E8DDD4' }}>
            {['Order', 'Customer', 'Status', 'Fulfillment', 'Total', 'Date', ''].map((h) => (
              <th key={h} style={{
                padding: '10px 12px',
                fontFamily: "'Jost', sans-serif",
                fontWeight: 400,
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#8C7B74',
                textAlign: 'left',
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const s = statusConfig[order.status]
            return (
              <tr key={order.id} style={{ borderBottom: '1px solid #F2EDE8' }}>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }}>
                    {order.order_number}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }}>
                    {order.customer_name}
                  </p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
                    {order.customer_email}
                  </p>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 300,
                    fontSize: '11px',
                    color: s.color,
                    background: s.bg,
                    padding: '3px 8px',
                    borderRadius: '99px',
                    whiteSpace: 'nowrap',
                  }}>
                    {s.label}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', textTransform: 'capitalize' }}>
                    {order.fulfillment}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '15px', color: '#2C2420' }}>
                    {formatCurrency(order.total)}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', whiteSpace: 'nowrap' }}>
                    {new Date(order.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <Link href={`/admin/orders/${order.id}`}
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#B76E79', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    View →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {showViewAll && (
        <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #E8DDD4' }}>
          <Link href="/admin/orders"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '14px', color: '#B76E79', textDecoration: 'none' }}>
            View all orders →
          </Link>
        </div>
      )}
    </div>
  )
}
