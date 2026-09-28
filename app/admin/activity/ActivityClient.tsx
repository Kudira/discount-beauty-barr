'use client'

import { useState, useMemo } from 'react'
import { Activity, Search } from 'lucide-react'

const ACTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'order.created':        { label: 'Order Created',      color: '#16A34A', bg: '#F0FDF4' },
  'order.status_updated': { label: 'Order Updated',      color: '#1D4ED8', bg: '#EFF6FF' },
  'product.created':      { label: 'Product Created',    color: '#7C3AED', bg: '#F5F3FF' },
  'product.updated':      { label: 'Product Updated',    color: '#7C3AED', bg: '#F5F3FF' },
  'user.role_updated':    { label: 'Role Changed',       color: '#D97706', bg: '#FEF3C7' },
  'inventory.adjusted':   { label: 'Stock Adjusted',     color: '#0891B2', bg: '#ECFEFF' },
  'content.updated':      { label: 'Content Updated',    color: '#B76E79', bg: '#FDF5F6' },
  'pos.sale':             { label: 'POS Sale',           color: '#065F46', bg: '#D1FAE5' },
  'pos.login':            { label: 'POS Sign-in',        color: '#1D4ED8', bg: '#EFF6FF' },
  'pos.logout':           { label: 'POS Sign-out',       color: '#475569', bg: '#F1F5F9' },
  'pos.login_failed':     { label: 'Wrong PIN',          color: '#DC2626', bg: '#FEF2F2' },
  'pos.momo_requested':   { label: 'MoMo Prompt Sent',   color: '#B45309', bg: '#FFFBEB' },
  'payment.success':      { label: 'Online Payment',     color: '#16A34A', bg: '#F0FDF4' },
  'payment.amount_mismatch': { label: 'Payment Mismatch', color: '#DC2626', bg: '#FEF2F2' },
  'user.pin_updated':     { label: 'PIN Changed',        color: '#D97706', bg: '#FEF3C7' },
  'staff.created':        { label: 'Cashier Added',      color: '#7C3AED', bg: '#F5F3FF' },
}

// Internal ids that aren't useful to read in the log
const HIDDEN_DETAILS = new Set(['terminal_user_id'])

export function ActivityClient({ logs }: { logs: any[] }) {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')

  const filtered = useMemo(() => logs.filter((log) => {
    const matchSearch = !search ||
      log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      String(log.details?.staff ?? '').toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.entity_id?.toLowerCase().includes(search.toLowerCase())
    const matchAction = actionFilter === 'all' || log.action === actionFilter
    return matchSearch && matchAction
  }), [logs, search, actionFilter])

  const uniqueActions = [...new Set(logs.map((l) => l.action).filter(Boolean))]

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none',
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>
          <Activity size={24} color="#B76E79" /> Activity Log
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
          {logs.length} events recorded · Showing last 200
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} color="#B76E79" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by staff, email, action, or ID…"
            style={{ ...inputStyle, width: '100%', paddingLeft: '34px' }} />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer', minWidth: '180px' }}>
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]?.label ?? a}</option>
          ))}
        </select>
      </div>

      {/* Log table */}
      <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8DDD4' }}>
                {['Time', 'User', 'Action', 'Details'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C7B74', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>No activity recorded yet</p>
                </td></tr>
              ) : filtered.map((log) => {
                const ac = ACTION_LABELS[log.action]
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F2EDE8' }}>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#2C2420' }}>
                        {new Date(log.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}
                      </p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
                        {new Date(log.created_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#2C2420' }}>
                        {log.details?.staff ?? log.user_email ?? 'System'}
                      </p>
                      {log.user_role && (
                        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '10px', color: '#C4B8B2', textTransform: 'capitalize' }}>
                          {log.user_role}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: ac?.color ?? '#8C7B74', background: ac?.bg ?? '#F3F4F6', padding: '3px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                        {ac?.label ?? log.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: '260px' }}>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74', lineHeight: 1.5 }} className="truncate">
                          {Object.entries(log.details).filter(([k]) => !HIDDEN_DETAILS.has(k) && k !== 'staff').map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                      {log.entity_id && (
                        <p style={{ fontWeight: 300, fontSize: '10px', color: '#C4B8B2', marginTop: '2px', fontFamily: 'monospace' }}>
                          {log.entity_id.slice(0, 16)}…
                        </p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
