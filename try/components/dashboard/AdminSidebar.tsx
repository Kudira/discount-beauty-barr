'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, ShoppingBag, Package, Users,
  BarChart2, AlertTriangle, LogOut, X, Store,
  ChevronRight, Image, Layers, Shield, Activity
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',  href: '/admin',           icon: LayoutDashboard },
  { label: 'Orders',     href: '/admin/orders',     icon: ShoppingBag },
  { label: 'Products',   href: '/admin/products',   icon: Package },
  { label: 'Inventory',  href: '/admin/inventory',  icon: Layers },
  { label: 'Customers',  href: '/admin/customers',  icon: Users },
  { label: 'Content',    href: '/admin/content',    icon: Image },
  { label: 'Reports',    href: '/admin/reports',    icon: BarChart2 },
  { label: 'Team',       href: '/admin/users',      icon: Shield },
  { label: 'Activity',   href: '/admin/activity',   icon: Activity },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(44,36,32,0.5)' }}
          onClick={onClose} />
      )}

      <aside className="fixed top-0 left-0 h-full z-50 flex flex-col lg:static lg:flex"
        style={{ width: '240px', background: '#2C2420', flexShrink: 0 }}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '18px', color: 'white' }}>
              Discount Beauty Barr<span style={{ color: '#E8B4A0' }}>.</span>
            </div>
            <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              Admin Panel
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="lg:hidden"
              style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {navItems.map(({ label, href, icon: Icon }) => {
              const active = isActive(href)
              return (
                <li key={href}>
                  <Link href={href} onClick={onClose}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 12px', borderRadius: '4px',
                      background: active ? 'rgba(183,110,121,0.2)' : 'transparent',
                      textDecoration: 'none', transition: 'background 0.15s',
                    }}>
                    <Icon size={15} color={active ? '#E8B4A0' : 'rgba(255,255,255,0.45)'} />
                    <span style={{
                      fontFamily: "'Jost', sans-serif", fontWeight: active ? 400 : 300,
                      fontSize: '13px', color: active ? 'white' : 'rgba(255,255,255,0.55)',
                    }}>
                      {label}
                    </span>
                    {active && <ChevronRight size={11} color="rgba(255,255,255,0.3)" style={{ marginLeft: 'auto' }} />}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Link href="/" target="_blank"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '4px', textDecoration: 'none' }}>
              <Store size={15} color="rgba(255,255,255,0.3)" />
              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                View Store
              </span>
            </Link>
            <Link href="/pos"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '4px', textDecoration: 'none' }}>
              <ShoppingBag size={15} color="rgba(255,255,255,0.3)" />
              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                Open POS
              </span>
            </Link>
          </div>
        </nav>

        {/* User */}
        <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#B76E79', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: '13px', color: 'white' }}>
                {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.full_name ?? 'Admin'}
              </p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                {profile?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <a href="/auth/signout"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', cursor: 'pointer', textDecoration: 'none' }}>
            <LogOut size={13} color="rgba(255,255,255,0.4)" />
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Sign Out</span>
          </a>
        </div>
      </aside>
    </>
  )
}
