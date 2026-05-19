'use client'

import { useState } from 'react'
import { Shield, UserPlus, Edit2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const ROLES = [
  { value: 'super_admin', label: 'Super Admin', desc: 'Full access, can manage other admins', color: '#7C3AED', bg: '#F5F3FF' },
  { value: 'admin',       label: 'Admin',       desc: 'Full access to all admin features',   color: '#B76E79', bg: '#FDF5F6' },
  { value: 'manager',     label: 'Manager',     desc: 'Orders, products, inventory',         color: '#1D4ED8', bg: '#EFF6FF' },
  { value: 'cashier',     label: 'Cashier',     desc: 'POS system only',                     color: '#065F46', bg: '#D1FAE5' },
  { value: 'read_only',   label: 'Read Only',   desc: 'View all data, no edits',             color: '#6B7280', bg: '#F3F4F6' },
]

const roleConfig = Object.fromEntries(ROLES.map((r) => [r.value, r]))

export function UsersClient({ users }: { users: any[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [localUsers, setLocalUsers] = useState(users)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [saving, setSaving] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('cashier')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')

  const startEdit = (user: any) => {
    setEditingId(user.id)
    setEditRole(user.role)
  }

  const cancelEdit = () => { setEditingId(null); setEditRole('') }

  const saveRole = async (userId: string) => {
    setSaving(true)
    await (supabase as any).from('profiles').update({ role: editRole }).eq('id', userId)
    setLocalUsers((p) => p.map((u) => u.id === userId ? { ...u, role: editRole } : u))
    setSaving(false)
    setEditingId(null)

    // Log activity
    await (supabase as any).from('activity_log').insert({
      action: 'user.role_updated',
      entity_type: 'user',
      entity_id: userId,
      details: { new_role: editRole },
    })
    router.refresh()
  }

  const handleInvite = async () => {
    if (!inviteEmail) return
    setInviting(true)
    setInviteMsg('')
    try {
      // Send magic link invite via Supabase Admin
      // For now we set the role via a note — full invite requires Edge Function
      setInviteMsg(`✓ Invitation workflow: Ask ${inviteEmail} to sign up at /register, then set their role here once they do.`)
    } catch {
      setInviteMsg('Failed to send invite.')
    }
    setInviting(false)
  }

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px',
    fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none',
  }

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-6">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>
          Team & Access
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
          Manage staff roles and permissions
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

      {/* Invite */}
      <div className="p-5" style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px' }}>
        <h2 className="flex items-center gap-2 mb-4"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420' }}>
          <UserPlus size={18} color="#B76E79" /> Add Team Member
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address" type="email"
            style={{ ...inputStyle, flex: 1 }} />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button onClick={handleInvite} disabled={inviting || !inviteEmail}
            style={{ padding: '9px 20px', background: '#2C2420', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', whiteSpace: 'nowrap' }}>
            {inviting ? 'Sending…' : 'Add Member'}
          </button>
        </div>
        {inviteMsg && (
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#16A34A', marginTop: '8px' }}>{inviteMsg}</p>
        )}
      </div>

      {/* Users table */}
      <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E8DDD4' }}>
                {['User', 'Role', 'Branch', 'Joined', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8C7B74', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {localUsers.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>
                    No staff accounts yet. Add team members above.
                  </p>
                </td></tr>
              )}
              {localUsers.map((user) => {
                const rc = roleConfig[user.role]
                const isEditing = editingId === user.id
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #F2EDE8' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#B76E79', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '13px', color: 'white' }}>
                            {user.full_name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }}>{user.full_name || '—'}</p>
                          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {isEditing ? (
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}>
                          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: rc?.color ?? '#8C7B74', background: rc?.bg ?? '#F3F4F6', padding: '3px 10px', borderRadius: '99px' }}>
                          <Shield size={10} className="inline mr-1" />{rc?.label ?? user.role}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', textTransform: 'capitalize' }}>
                        {user.branch_id?.replace('-', ' ') ?? 'All'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', whiteSpace: 'nowrap' }}>
                        {new Date(user.created_at).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
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
                          <Edit2 size={12} /> Edit Role
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
