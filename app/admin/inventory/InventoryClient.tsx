'use client'

import { useState, useMemo } from 'react'
import { Search, AlertTriangle, RefreshCw, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Branch { id: string; label: string }

interface InventoryRecord {
  id: string
  variant_id: string
  branch_id: string
  quantity: number
  low_stock_threshold: number
}

interface VariantRecord {
  id: string
  name: string
  sku: string
  price: number
  products: {
    id: string
    name: string
    brand: string
    category: string
    is_active: boolean
  } | null
}

interface Row {
  key: string
  variant: VariantRecord
  branchId: string
  exists: boolean // false = this branch has no stock record for the variant yet
  quantity: number
  threshold: number
}

type Stock = { id: string; quantity: number; threshold: number }

const keyOf = (variantId: string, branchId: string) => `${variantId}:${branchId}`

export function InventoryClient({
  inventory, variants, branches,
}: { inventory: InventoryRecord[]; variants: VariantRecord[]; branches: Branch[] }) {
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState<'all' | string>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'negative' | 'unset'>('all')
  const [visibility, setVisibility] = useState<'all' | 'active' | 'hidden'>('all')
  const [editing, setEditing] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [stock, setStock] = useState<Record<string, Stock>>(() => {
    const m: Record<string, Stock> = {}
    for (const r of inventory) m[keyOf(r.variant_id, r.branch_id)] = { id: r.id, quantity: r.quantity, threshold: r.low_stock_threshold }
    return m
  })
  const [transferMode, setTransferMode] = useState(false)
  const [transfer, setTransfer] = useState({
    variantId: '', fromBranch: branches[0]?.id ?? '', toBranch: branches[1]?.id ?? branches[0]?.id ?? '', quantity: 1, note: '',
  })
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState('')

  const branchLabel = (id: string) => branches.find((b) => b.id === id)?.label ?? id

  // One row per variant per branch, whether or not a stock record exists yet.
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = []
    const sorted = [...variants].sort((a, b) =>
      (a.products?.name ?? '').localeCompare(b.products?.name ?? '') || a.name.localeCompare(b.name))
    for (const v of sorted) {
      for (const b of branches) {
        const s = stock[keyOf(v.id, b.id)]
        out.push({ key: keyOf(v.id, b.id), variant: v, branchId: b.id, exists: !!s, quantity: s?.quantity ?? 0, threshold: s?.threshold ?? 5 })
      }
    }
    return out
  }, [variants, branches, stock])

  const isLow = (r: Row) => r.exists && r.quantity > 0 && r.quantity <= r.threshold
  const isOut = (r: Row) => r.exists && r.quantity === 0
  const isNeg = (r: Row) => r.exists && r.quantity < 0 // sold at the till before the stock was recorded

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rows.filter((r) => {
      const p = r.variant.products
      const matchSearch = !q ||
        p?.name?.toLowerCase().includes(q) || p?.brand?.toLowerCase().includes(q) || r.variant.sku?.toLowerCase().includes(q)
      const matchBranch = branchFilter === 'all' || r.branchId === branchFilter
      const matchStock = stockFilter === 'all' ||
        (stockFilter === 'out' && isOut(r)) ||
        (stockFilter === 'low' && isLow(r)) ||
        (stockFilter === 'negative' && isNeg(r)) ||
        (stockFilter === 'unset' && !r.exists)
      const matchVis = visibility === 'all' || (visibility === 'active' ? p?.is_active !== false : p?.is_active === false)
      return matchSearch && matchBranch && matchStock && matchVis
    })
  }, [rows, search, branchFilter, stockFilter, visibility])

  const stats = useMemo(() => ({
    total: rows.length,
    outOfStock: rows.filter(isOut).length,
    lowStock: rows.filter(isLow).length,
    negative: rows.filter(isNeg).length,
    unset: rows.filter((r) => !r.exists).length,
  }), [rows])

  const startEdit = (key: string, currentQty: number) => setEditing((prev) => ({ ...prev, [key]: currentQty }))
  const handleQtyChange = (key: string, val: number) =>
    setEditing((prev) => ({ ...prev, [key]: Number.isFinite(val) ? Math.max(0, Math.floor(val)) : 0 }))

  const handleSaveQty = async (row: Row) => {
    const newQty = editing[row.key]
    if (newQty === undefined) return
    setSaving(row.key)
    setError('')
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: row.variant.id, branchId: row.branchId, quantity: newQty }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setError(json.error ?? 'Could not save the stock level.'); return }
      setStock((prev) => ({ ...prev, [row.key]: { id: json.inventoryId, quantity: newQty, threshold: prev[row.key]?.threshold ?? 5 } }))
      setEditing((prev) => { const n = { ...prev }; delete n[row.key]; return n })
      setSaved(row.key)
      setTimeout(() => setSaved(null), 2000)
    } catch {
      setError('No connection. Check the internet and try again.')
    } finally {
      setSaving(null)
    }
  }

  const handleTransfer = async () => {
    if (!transfer.variantId || transfer.quantity < 1) return
    setTransferring(true)
    setTransferError('')
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transfer),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setTransferError(json.error ?? 'Transfer failed.'); return }
      setStock((prev) => ({
        ...prev,
        [keyOf(transfer.variantId, transfer.fromBranch)]: { id: json.from.id, quantity: json.from.quantity, threshold: prev[keyOf(transfer.variantId, transfer.fromBranch)]?.threshold ?? 5 },
        [keyOf(transfer.variantId, transfer.toBranch)]: { id: json.to.id, quantity: json.to.quantity, threshold: prev[keyOf(transfer.variantId, transfer.toBranch)]?.threshold ?? 5 },
      }))
      setTransferMode(false)
      setTransfer((p) => ({ ...p, variantId: '', quantity: 1, note: '' }))
    } catch {
      setTransferError('No connection. Check the internet and try again.')
    } finally {
      setTransferring(false)
    }
  }

  const getStockStatus = (row: Row) => {
    if (!row.exists) return { label: 'Not set up', color: '#8C7B74', bg: '#F2EDE8' }
    if (row.quantity < 0) return { label: 'Negative: recount', color: '#9D174D', bg: '#FCE7F3' }
    if (row.quantity === 0) return { label: 'Out of Stock', color: '#DC2626', bg: '#FEF2F2' }
    if (row.quantity <= row.threshold) return { label: 'Low Stock', color: '#D97706', bg: '#FEF3C7' }
    return { label: 'In Stock', color: '#16A34A', bg: '#F0FDF4' }
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: '#B76E79', marginBottom: '5px',
  }

  const branchNames = branches.map((b) => b.label).join(', ')

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>
            Inventory
          </h1>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
            Manage stock levels across {branchNames}. Every product is listed for every branch, so you can add stock anywhere.
          </p>
        </div>
        <button
          onClick={() => { setTransferError(''); setTransferMode(true) }}
          className="flex items-center gap-2"
          style={{ padding: '10px 20px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          <RefreshCw size={15} /> Transfer Stock
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Product × branch', value: stats.total, color: '#2C2420', bg: 'white' },
          { label: 'Low Stock', value: stats.lowStock, color: '#D97706', bg: '#FEF3C7' },
          { label: 'Out of Stock', value: stats.outOfStock, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Negative', value: stats.negative, color: '#9D174D', bg: '#FCE7F3' },
          { label: 'Not set up', value: stats.unset, color: '#8C7B74', bg: '#F2EDE8' },
        ].map((s) => (
          <div key={s.label} className="p-4 text-center"
            style={{ background: s.bg, border: '1px solid #E8DDD4', borderRadius: '4px' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '32px', color: s.color, lineHeight: 1 }}>
              {s.value}
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74', marginTop: '4px' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px', padding: '10px 14px' }}>
          {error}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} color="#B76E79" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, brand or SKU..."
            style={{ ...inputStyle, width: '100%', paddingLeft: '34px' }} />
        </div>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="all">All Branches</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="all">All Stock Levels</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
          <option value="negative">Negative (sold, not recorded)</option>
          <option value="unset">Not set up</option>
        </select>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="all">All products</option>
          <option value="active">Live in shop</option>
          <option value="hidden">Hidden (e.g. clearance)</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8DDD4' }}>
                {['Product', 'SKU', 'Branch', 'Stock', 'Threshold', 'Status', 'Price', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C7B74', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const v = row.variant
                const p = v.products
                const status = getStockStatus(row)
                const isEditing = editing[row.key] !== undefined
                const isSaving = saving === row.key
                const isSaved = saved === row.key

                return (
                  <tr key={row.key} style={{ borderBottom: '1px solid #F2EDE8' }}>
                    <td style={{ padding: '12px 14px', maxWidth: '240px' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }} className="truncate">
                        {p?.name}{v.name && v.name !== p?.name ? ` — ${v.name}` : ''}
                      </p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
                        {p?.brand} · <span style={{ textTransform: 'capitalize' }}>{p?.category}</span>
                        {p?.is_active === false && ' · hidden'}
                      </p>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: 300, fontSize: '11px', color: '#B0A39C', fontFamily: 'monospace' }}>{v.sku}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#2C2420' }}>
                        {branchLabel(row.branchId)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {isEditing ? (
                        <input
                          type="number" min="0" step="1"
                          value={editing[row.key]}
                          onChange={(e) => handleQtyChange(row.key, Number(e.target.value))}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveQty(row) }}
                          style={{ ...inputStyle, width: '80px', padding: '5px 8px' }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: status.color }}>
                          {row.exists ? row.quantity : '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>{row.threshold}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: status.color, background: status.bg, padding: '3px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                        {isOut(row) && <AlertTriangle size={10} className="inline mr-1" />}
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '14px', color: '#2C2420' }}>
                        {formatCurrency(v.price ?? 0)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveQty(row)} disabled={isSaving}
                              style={{ padding: '5px 10px', background: isSaved ? '#16A34A' : '#2C2420', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Jost', sans-serif" }}>
                              {isSaved ? <Check size={12} /> : isSaving ? '...' : 'Save'}
                            </button>
                            <button onClick={() => setEditing((prev) => { const n = { ...prev }; delete n[row.key]; return n })}
                              style={{ padding: '5px 8px', background: '#F2EDE8', color: '#8C7B74', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(row.key, row.quantity)}
                            style={{ padding: '5px 10px', background: '#F2EDE8', color: '#2C2420', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px' }}>
                            {row.exists ? 'Adjust' : 'Add stock'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>No inventory records found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Transfer Modal */}
      {transferMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(44,36,32,0.5)' }}
          onClick={() => setTransferMode(false)}>
          <div className="w-full max-w-md flex flex-col gap-5 p-6"
            style={{ background: 'white', borderRadius: '8px', margin: '16px' }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '24px', color: '#2C2420' }}>
              Transfer Stock
            </h2>

            <div>
              <label style={labelStyle}>Product Variant</label>
              <select value={transfer.variantId} onChange={(e) => setTransfer((p) => ({ ...p, variantId: e.target.value }))}
                style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                <option value="">Select a variant...</option>
                {[...variants]
                  .sort((a, b) => (a.products?.name ?? '').localeCompare(b.products?.name ?? ''))
                  .map((v) => (
                    <option key={v.id} value={v.id}>{v.products?.name} — {v.name} ({v.sku})</option>
                  ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>From Branch</label>
                <select value={transfer.fromBranch} onChange={(e) => setTransfer((p) => ({ ...p, fromBranch: e.target.value }))}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>To Branch</label>
                <select value={transfer.toBranch} onChange={(e) => setTransfer((p) => ({ ...p, toBranch: e.target.value }))}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Quantity</label>
              <input type="number" min="1" step="1" value={transfer.quantity}
                onChange={(e) => setTransfer((p) => ({ ...p, quantity: Math.floor(Number(e.target.value)) || 0 }))}
                style={{ ...inputStyle, width: '100%' }} />
            </div>

            <div>
              <label style={labelStyle}>Note (optional)</label>
              <input value={transfer.note}
                onChange={(e) => setTransfer((p) => ({ ...p, note: e.target.value }))}
                placeholder="Reason for transfer..."
                style={{ ...inputStyle, width: '100%' }} />
            </div>

            {transferError && (
              <p role="alert" style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#DC2626' }}>{transferError}</p>
            )}

            <div className="flex gap-3">
              <button onClick={handleTransfer}
                disabled={transferring || !transfer.variantId || transfer.quantity < 1 || transfer.fromBranch === transfer.toBranch}
                style={{ flex: 1, padding: '12px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (!transfer.variantId || transfer.quantity < 1 || transfer.fromBranch === transfer.toBranch) ? 0.5 : 1 }}>
                {transferring ? 'Transferring...' : 'Confirm Transfer'}
              </button>
              <button onClick={() => setTransferMode(false)}
                style={{ padding: '12px 20px', background: '#F2EDE8', color: '#2C2420', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
