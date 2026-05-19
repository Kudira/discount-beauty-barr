'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

type BranchId = 'osu' | 'east-legon'

interface InventoryRow {
  id: string
  quantity: number
  low_stock_threshold: number
  branch_id: BranchId
  updated_at: string
  product_variants: {
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
    }
  }
}

const BRANCHES: { id: BranchId; label: string }[] = [
  { id: 'osu', label: 'Osu' },
  { id: 'east-legon', label: 'East Legon' },
]

export function InventoryClient({ inventory }: { inventory: InventoryRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState<'all' | BranchId>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')
  const [editing, setEditing] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [localInventory, setLocalInventory] = useState(inventory)
  const [transferMode, setTransferMode] = useState(false)
  const [transfer, setTransfer] = useState({ variantId: '', fromBranch: 'osu' as BranchId, toBranch: 'east-legon' as BranchId, quantity: 1, note: '' })
  const [transferring, setTransferring] = useState(false)
  const supabase = createClient()

  const filtered = useMemo(() => {
    return localInventory.filter((row) => {
      const v = row.product_variants
      const p = v?.products
      const matchSearch = !search ||
        p?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p?.brand?.toLowerCase().includes(search.toLowerCase()) ||
        v?.sku?.toLowerCase().includes(search.toLowerCase())
      const matchBranch = branchFilter === 'all' || row.branch_id === branchFilter
      const matchStock = stockFilter === 'all' ||
        (stockFilter === 'out' && row.quantity === 0) ||
        (stockFilter === 'low' && row.quantity > 0 && row.quantity <= row.low_stock_threshold)
      return matchSearch && matchBranch && matchStock
    })
  }, [localInventory, search, branchFilter, stockFilter])

  const stats = useMemo(() => ({
    total: localInventory.length,
    outOfStock: localInventory.filter((r) => r.quantity === 0).length,
    lowStock: localInventory.filter((r) => r.quantity > 0 && r.quantity <= r.low_stock_threshold).length,
  }), [localInventory])

  const startEdit = (id: string, currentQty: number) => {
    setEditing((prev) => ({ ...prev, [id]: currentQty }))
  }

  const handleQtyChange = (id: string, val: number) => {
    setEditing((prev) => ({ ...prev, [id]: Math.max(0, val) }))
  }

  const handleSaveQty = async (id: string) => {
    const newQty = editing[id]
    if (newQty === undefined) return
    setSaving(id)
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, quantity: newQty }),
      })
      if (!res.ok) { const j = await res.json(); console.error('Inventory error:', j.error); return }
      setSaved(id)
      setEditing((prev) => { const n = { ...prev }; delete n[id]; return n })
      setLocalInventory((prev) => prev.map((row) => row.id === id ? { ...row, quantity: newQty } : row))
      setTimeout(() => setSaved(null), 2000)
    } finally {
      setSaving(null)
    }
  }

  const handleTransfer = async () => {
    if (!transfer.variantId || transfer.quantity < 1) return
    setTransferring(true)

    try {
      // Get current quantities via admin API
      const supabase = createClient()
      const { data: fromInv } = await (supabase.from('inventory') as any)
        .select('id, quantity')
        .eq('variant_id', transfer.variantId)
        .eq('branch_id', transfer.fromBranch)
        .single()

      const { data: toInv } = await (supabase.from('inventory') as any)
        .select('id, quantity')
        .eq('variant_id', transfer.variantId)
        .eq('branch_id', transfer.toBranch)
        .single()

      if (!fromInv || fromInv.quantity < transfer.quantity) {
        alert('Insufficient stock for transfer')
        setTransferring(false)
        return
      }

      // Use admin API route for updates
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromId: fromInv.id,
          fromQty: fromInv.quantity - transfer.quantity,
          toId: toInv?.id,
          toQty: (toInv?.quantity ?? 0) + transfer.quantity,
        }),
      })

      if (res.ok) {
        setLocalInventory((prev) => prev.map((row) => {
          if (row.product_variants?.id === transfer.variantId && row.branch_id === transfer.fromBranch) {
            return { ...row, quantity: fromInv.quantity - transfer.quantity }
          }
          if (row.product_variants?.id === transfer.variantId && row.branch_id === transfer.toBranch) {
            return { ...row, quantity: (toInv?.quantity ?? 0) + transfer.quantity }
          }
          return row
        }))
        setTransferMode(false)
        setTransfer({ variantId: '', fromBranch: 'osu', toBranch: 'east-legon', quantity: 1, note: '' })
      }
    } catch (err: any) {
      console.error('Transfer error:', err)
    } finally {
      setTransferring(false)
    }
  }

  const getStockStatus = (row: InventoryRow) => {
    if (row.quantity === 0) return { label: 'Out of Stock', color: '#DC2626', bg: '#FEF2F2' }
    if (row.quantity <= row.low_stock_threshold) return { label: 'Low Stock', color: '#D97706', bg: '#FEF3C7' }
    return { label: 'In Stock', color: '#16A34A', bg: '#F0FDF4' }
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none',
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>
            Inventory
          </h1>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
            Manage stock levels across Osu and East Legon
          </p>
        </div>
        <button
          onClick={() => setTransferMode(true)}
          className="flex items-center gap-2"
          style={{ padding: '10px 20px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          <RefreshCw size={15} /> Transfer Stock
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total SKUs', value: stats.total, color: '#2C2420', bg: 'white' },
          { label: 'Low Stock', value: stats.lowStock, color: '#D97706', bg: '#FEF3C7' },
          { label: 'Out of Stock', value: stats.outOfStock, color: '#DC2626', bg: '#FEF2F2' },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} color="#B76E79" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, brand or SKU..."
            style={{ ...inputStyle, width: '100%', paddingLeft: '34px' }} />
        </div>
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value as any)}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="all">All Branches</option>
          <option value="osu">Osu</option>
          <option value="east-legon">East Legon</option>
        </select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as any)}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="all">All Stock Levels</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
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
                const v = row.product_variants
                const p = v?.products
                const status = getStockStatus(row)
                const isEditing = editing[row.id] !== undefined
                const isSaving = saving === row.id
                const isSaved = saved === row.id

                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #F2EDE8' }}>
                    <td style={{ padding: '12px 14px', maxWidth: '200px' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }}
                        className="truncate">{p?.name}</p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
                        {p?.brand} · <span style={{ textTransform: 'capitalize' }}>{p?.category}</span>
                      </p>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#C4B8B2', fontFamily: 'monospace' }}>
                        {v?.sku}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#2C2420', textTransform: 'capitalize' }}>
                        {row.branch_id === 'east-legon' ? 'East Legon' : 'Osu'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {isEditing ? (
                        <input
                          type="number" min="0"
                          value={editing[row.id]}
                          onChange={(e) => handleQtyChange(row.id, Number(e.target.value))}
                          style={{ ...inputStyle, width: '70px', padding: '5px 8px' }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: status.color }}>
                          {row.quantity}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
                        {row.low_stock_threshold}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: status.color, background: status.bg, padding: '3px 8px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                        {row.quantity === 0 && <AlertTriangle size={10} className="inline mr-1" />}
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '14px', color: '#2C2420' }}>
                        {formatCurrency(v?.price ?? 0)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveQty(row.id)} disabled={isSaving}
                              style={{ padding: '5px 10px', background: isSaved ? '#16A34A' : '#2C2420', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Jost', sans-serif" }}>
                              {isSaved ? <Check size={12} /> : isSaving ? '...' : 'Save'}
                            </button>
                            <button onClick={() => setEditing((p) => { const n = { ...p }; delete n[row.id]; return n })}
                              style={{ padding: '5px 8px', background: '#F2EDE8', color: '#8C7B74', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(row.id, row.quantity)}
                            style={{ padding: '5px 10px', background: '#F2EDE8', color: '#2C2420', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px' }}>
                            Adjust
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
              <label style={{ display: 'block', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: '#B76E79', marginBottom: '5px' }}>
                Product Variant
              </label>
              <select value={transfer.variantId} onChange={(e) => setTransfer((p) => ({ ...p, variantId: e.target.value }))}
                style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                <option value="">Select a variant...</option>
                {[...new Map(inventory.map((r) => [r.product_variants?.id, r])).values()].map((row) => (
                  <option key={row.product_variants?.id} value={row.product_variants?.id}>
                    {row.product_variants?.products?.name} — {row.product_variants?.name} ({row.product_variants?.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: 'block', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: '#B76E79', marginBottom: '5px' }}>From Branch</label>
                <select value={transfer.fromBranch} onChange={(e) => setTransfer((p) => ({ ...p, fromBranch: e.target.value as BranchId }))}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                  {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: '#B76E79', marginBottom: '5px' }}>To Branch</label>
                <select value={transfer.toBranch} onChange={(e) => setTransfer((p) => ({ ...p, toBranch: e.target.value as BranchId }))}
                  style={{ ...inputStyle, width: '100%', cursor: 'pointer' }}>
                  {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: '#B76E79', marginBottom: '5px' }}>Quantity</label>
              <input type="number" min="1" value={transfer.quantity}
                onChange={(e) => setTransfer((p) => ({ ...p, quantity: Number(e.target.value) }))}
                style={{ ...inputStyle, width: '100%' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: '#B76E79', marginBottom: '5px' }}>Note (optional)</label>
              <input value={transfer.note}
                onChange={(e) => setTransfer((p) => ({ ...p, note: e.target.value }))}
                placeholder="Reason for transfer..."
                style={{ ...inputStyle, width: '100%' }} />
            </div>

            <div className="flex gap-3">
              <button onClick={handleTransfer} disabled={transferring || !transfer.variantId || transfer.fromBranch === transfer.toBranch}
                style={{ flex: 1, padding: '12px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: (!transfer.variantId || transfer.fromBranch === transfer.toBranch) ? 0.5 : 1 }}>
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
