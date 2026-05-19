'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function CustomersClient({ customers }: { customers: any[] }) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    customers.filter((c) =>
      !search ||
      c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    ), [customers, search])

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>Customers</h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>{customers.length} registered customers</p>
      </div>

      <div className="relative max-w-md">
        <Search size={14} color="#B76E79" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or phone..."
          style={{ width: '100%', padding: '10px 12px 10px 34px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none' }} />
      </div>

      <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8DDD4' }}>
                {['Customer', 'Phone', 'Orders', 'Total Spent', 'Joined'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C7B74', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F2EDE8' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#B76E79', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '12px', color: 'white' }}>
                          {c.full_name?.[0]?.toUpperCase() ?? c.email?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }}>{c.full_name || '—'}</p>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>{c.phone ?? '—'}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }}>{c.order_count}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '15px', color: '#2C2420' }}>{formatCurrency(c.total_spent)}</span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', whiteSpace: 'nowrap' }}>
                      {new Date(c.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>No customers found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
