'use client'

import { useState } from 'react'
import { Delete, LogIn } from 'lucide-react'
import { POSClient } from './POSClient'
import type { Product } from '@/types'

interface StaffMember {
  id: string
  full_name: string
  role: string
  branch_id: string | null
  pos_pin: string
}

interface POSAuthWrapperProps {
  products: Product[]
  staff: StaffMember[]
  currentUserName: string
  currentUserRole: string
  defaultBranch: string
}

export function POSAuthWrapper({ products, staff, currentUserName, currentUserRole, defaultBranch }: POSAuthWrapperProps) {
  const [authenticated, setAuthenticated] = useState(false)
  const [activeCashier, setActiveCashier] = useState<StaffMember | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleDigit = (d: string) => {
    if (pin.length < 6) setPin((p) => p + d)
  }

  const handleDelete = () => setPin((p) => p.slice(0, -1))

  const handleLogin = () => {
    if (!selectedStaff) { setError('Please select your name first'); return }
    if (selectedStaff.pos_pin === pin) {
      setActiveCashier(selectedStaff)
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect PIN. Please try again.')
      setPin('')
    }
  }

  const handleLogout = () => {
    setAuthenticated(false)
    setActiveCashier(null)
    setSelectedStaff(null)
    setPin('')
    setError('')
  }

  if (authenticated && activeCashier) {
    return (
      <POSClient
        products={products}
        cashierName={activeCashier.full_name}
        branchId={activeCashier.branch_id ?? defaultBranch}
        onLogout={handleLogout}
      />
    )
  }

  // PIN login screen
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: '#2C2420' }}>
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">

        {/* Logo */}
        <div className="text-center mb-2">
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '26px', color: 'white', letterSpacing: '0.04em' }}>
            Discount Beauty Barr<span style={{ color: '#E8B4A0' }}>.</span>
          </h1>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Point of Sale
          </p>
        </div>

        {/* Staff selector */}
        <div className="w-full">
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textAlign: 'center' }}>
            Who's signing in?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {staff.length === 0 ? (
              <div className="col-span-2 text-center p-4"
                style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  No staff PINs set yet.
                </p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                  Go to Admin → Team to assign PINs.
                </p>
              </div>
            ) : (
              staff.map((s) => (
                <button key={s.id}
                  onClick={() => { setSelectedStaff(s); setPin(''); setError('') }}
                  style={{
                    padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: selectedStaff?.id === s.id ? '#B76E79' : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.15s',
                  }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: selectedStaff?.id === s.id ? 400 : 300, fontSize: '13px', color: 'white' }}>
                    {s.full_name || 'Unknown'}
                  </p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', textTransform: 'capitalize' }}>
                    {s.role} {s.branch_id ? `· ${s.branch_id.replace('-', ' ')}` : ''}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* PIN display */}
        {selectedStaff && (
          <>
            <div className="flex gap-3 items-center">
              {[0,1,2,3,4,5].map((i) => (
                <div key={i}
                  style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: i < pin.length ? '#E8B4A0' : 'rgba(255,255,255,0.15)',
                    transition: 'background 0.15s',
                  }} />
              ))}
            </div>

            {error && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#FCA5A5', textAlign: 'center' }}>
                {error}
              </p>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {['1','2','3','4','5','6','7','8','9','',  '0','⌫'].map((d, i) => {
                if (d === '') return <div key={i} />
                return (
                  <button key={i}
                    onClick={() => d === '⌫' ? handleDelete() : handleDigit(d)}
                    style={{
                      height: '64px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.1)', color: 'white',
                      fontFamily: d === '⌫' ? 'system-ui' : "'Cormorant Garamond', serif",
                      fontSize: d === '⌫' ? '20px' : '26px', fontWeight: 300,
                      transition: 'background 0.1s',
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                    onMouseUp={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
                    {d === '⌫' ? <Delete size={20} className="inline" /> : d}
                  </button>
                )
              })}
            </div>

            {/* Login button */}
            <button onClick={handleLogin} disabled={pin.length < 4}
              style={{
                width: '100%', padding: '14px', borderRadius: '8px', border: 'none',
                background: pin.length >= 4 ? '#B76E79' : 'rgba(255,255,255,0.1)',
                color: 'white', cursor: pin.length >= 4 ? 'pointer' : 'not-allowed',
                fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '17px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'background 0.2s',
              }}>
              <LogIn size={16} /> Sign In to POS
            </button>
          </>
        )}
      </div>
    </div>
  )
}
