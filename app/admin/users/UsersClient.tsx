'use client'

import { useState } from 'react'
import { Shield, Edit2, Check, X, KeyRound } from 'lucide-react'
import { updateUserRole, logActivity } from '@/lib/actions'
import { useRouter } from 'next/navigation'

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full access including team management', color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'admin',       label: 'Admin',       desc: 'Full admin panel access',               color: '#B76E79', bg: '#FDF5F6' },
  { value: 'manager',     label: 'Manager',     desc: 'Orders, products, inventory + POS',     color: '#1D4ED8', bg: '#EFF6FF' },
  { value: 'cashier',     label: 'Cashier',     desc: 'POS only — needs a PIN to log in',      color: '#065F46', bg: '#D1FAE5' },
  { value: 'read_only',   label: 'Read Only',   desc: 'View-only admin access',                color: '#6B7280', bg: '#F3F4F6' },
]

const roleConfig = Object.fromEntries(ROLES.map((r) => [r.value, r]))

const BRANCHES = [
  { id: 'osu', label: 'Osu Branch' },
  { id: 'east-legon', label: 'East Legon Branch' },
]

export function UsersClient({ users }: { users: any[] }) {
  const router = useRouter()
  const [localUsers, setLocalUsers] = useState(users)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editBranch, setEditBranch] = useState('')
  const [saving, setSaving] = useState(false)
  const [pinEditId, setPinEditId] = useState<string | null>(null)
  const [pinValue, setPinValue] = useState('')
  const [savingPin, setSavingPin] = useState(false)
  const [pinMsg, setPinMsg] = useState('')

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none',
  }

  const startEdit = (user: any) => {
    setEditingId(user.id)
    setEditRole(user.role)
    setEditBranch(user.branch_id ?? '')
  }

  const cancelEdit = () => { setEditingId(null); setEditRole(''); setEditBranch('') }

  const saveRole = async (userId: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: editRole, branch_id: editBranch || null }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setLocalUsers((p) => p.map((u) => u.id === userId ? { ...u, role: editRole, branch_id: editBranch || null } : u))
      logActivity({ action: 'user.role_updated', entity_type: 'user', entity_id: userId, details: { new_role: editRole, branch: editBranch } }).catch(() => {})
      setEditingId(null)
      router.refresh()
    } catch (err: any) {
      console.error('Role update failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const savePin = async (userId: string) => {
    if (!pinValue || pinValue.length < 4 || pinValue.length > 6 || !/^\d+$/.test(pinValue)) {
      setPinMsg('PIN must be 4–6 digits')
      return
    }
    setSavingPin(true)
    setPinMsg('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pos_pin: pinValue }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? 'Failed to save PIN')
      }
      setLocalUsers((p) => p.map((u) => u.id === userId ? { ...u, pos_pin: pinValue } : u))
      setPinMsg('✓ PIN saved')
      logActivity({ action: 'user.pin_updated', entity_type: 'user', entity_id: userId, details: {} }).catch(() => {})
      setTimeout(() => { setPinEditId(null); setPinMsg(''); setPinValue('') }, 1500)
    } catch (err: any) {
      setPinMsg(err?.message ?? 'Failed to save PIN')
    } finally {
      setSavingPin(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>
          Team & Access
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
          Manage staff roles, branch access, and POS PINs
        </p>
      </div>

      {/* Role legend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLES.map((r) => (
          <div key={r.value} className="p-3" style={{ background: r.bg, borderRadius: '6px', border: `1px solid ${r.color}22` }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '12px', color: r.color }}>{r.label}</p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74', marginTop: '2px', lineHeight: 1.4 }}>{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Add member note */}
      <div className="p-4" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4', borderRadius: '4px' }}>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74', lineHeight: 1.6 }}>
          <strong style={{ color: '#2C2420' }}>To add a team member:</strong> Ask them to create an account at <code style={{ background: '#F2EDE8', padding: '1px 5px', borderRadius: '3px', fontSize: '12px' }}>/register</code>, then find them here to set their role and branch.
        </p>
      </div>

      {/* Users table */}
      <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8DDD4' }}>
                {['User', 'Role', 'Branch', 'POS PIN', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C7B74', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localUsers.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>
                    No staff accounts yet.
                  </p>
                </td></tr>
              )}
              {localUsers.map((user) => {
                const rc = roleConfig[user.role]
                const isEditing = editingId === user.id
                const isPinEditing = pinEditId === user.id
                const needsPin = ['super_admin', 'admin', 'manager', 'cashier'].includes(user.role)

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #F2EDE8' }}>

                    {/* User info */}
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: rc?.color ?? '#B76E79', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '13px', color: 'white' }}>
                            {user.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }}>
                            {user.full_name || '—'}
                          </p>
                          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: '12px 14px' }}>
                      {isEditing ? (
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}>
                          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: rc?.color ?? '#8C7B74', background: rc?.bg ?? '#F3F4F6', padding: '3px 10px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                          <Shield size={10} className="inline mr-1" />{rc?.label ?? user.role}
                        </span>
                      )}
                    </td>

                    {/* Branch */}
                    <td style={{ padding: '12px 14px' }}>
                      {isEditing ? (
                        <select value={editBranch} onChange={(e) => setEditBranch(e.target.value)}
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}>
                          <option value="">All branches</option>
                          {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', textTransform: 'capitalize' }}>
                          {user.branch_id ? user.branch_id.replace('-', ' ') : 'All'}
                        </span>
                      )}
                    </td>

                    {/* POS PIN */}
                    <td style={{ padding: '12px 14px' }}>
                      {needsPin && (
                        isPinEditing ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="password"
                                value={pinValue}
                                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0,6))}
                                placeholder="4–6 digits"
                                maxLength={6}
                                style={{ ...inputStyle, width: '90px', padding: '5px 8px', fontSize: '12px', letterSpacing: '0.2em' }}
                                autoFocus
                              />
                              <button onClick={() => savePin(user.id)} disabled={savingPin}
                                style={{ padding: '5px 8px', background: '#2C2420', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontFamily: "'Jost', sans-serif" }}>
                                {savingPin ? '…' : <Check size={12} />}
                              </button>
                              <button onClick={() => { setPinEditId(null); setPinValue(''); setPinMsg('') }}
                                style={{ padding: '5px 6px', background: '#F2EDE8', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#8C7B74' }}>
                                <X size={12} />
                              </button>
                            </div>
                            {pinMsg && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: pinMsg.startsWith('✓') ? '#16A34A' : '#DC2626' }}>{pinMsg}</p>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: user.pos_pin ? '#16A34A' : '#DC2626' }}>
                              {user.pos_pin ? '●●●●' : 'No PIN'}
                            </span>
                            <button onClick={() => { setPinEditId(user.id); setPinValue('') }}
                              style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '3px 8px', background: '#F2EDE8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#2C2420' }}>
                              <KeyRound size={11} /> {user.pos_pin ? 'Change' : 'Set PIN'}
                            </button>
                          </div>
                        )
                      )}
                      {!needsPin && <span style={{ color: '#C4B8B2', fontSize: '12px' }}>—</span>}
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', whiteSpace: 'nowrap' }}>
                        {new Date(user.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 14px' }}>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => saveRole(user.id)} disabled={saving}
                            style={{ padding: '5px 12px', background: '#2C2420', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Jost', sans-serif", fontSize: '12px' }}>
                            <Check size={12} /> Save
                          </button>
                          <button onClick={cancelEdit}
                            style={{ padding: '5px 8px', background: '#F2EDE8', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#8C7B74' }}>
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(user)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: '#F2EDE8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420' }}>
                          <Edit2 size={12} /> Edit
                        </button>
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
