'use client'

import { useState, useMemo } from 'react'
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable'
import { Search } from 'lucide-react'

const ALL_STATUSES = ['all', 'pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled', 'refunded']

export function OrdersClient({ orders }: { orders: any[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_email?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = status === 'all' || o.status === status
      return matchSearch && matchStatus
    })
  }, [orders, search, status])

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>
          Orders
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
          {orders.length} total orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} color="#B76E79" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, name, or email..."
            style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none' }}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '10px 14px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none', cursor: 'pointer' }}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
        <RecentOrdersTable orders={filtered} showViewAll={false} />
      </div>
    </div>
  )
}
