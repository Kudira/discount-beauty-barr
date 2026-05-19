'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, ShoppingBag, Package, Users,
  BarChart2, LogOut, X, Store,
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
  const { profile } = useAuth()

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const initials = profile?.full_name
    ? profile.full_name.trim().split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : (profile as any)?.email?.[0]?.toUpperCase() ?? 'U'

  const sidebarContent = (
    <aside style={{
      width: '240px',
      background: '#2C2420',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '17px', color: 'white' }}>
            Discount Beauty Barr<span style={{ color: '#E8B4A0' }}>.</span>
          </div>
          <div style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            Admin Panel
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link href={href} onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 12px', borderRadius: '4px',
                    background: active ? 'rgba(183,110,121,0.2)' : 'transparent',
                    textDecoration: 'none', transition: 'background 0.15s',
                  }}>
                  <Icon size={15} color={active ? '#E8B4A0' : 'rgba(255,255,255,0.45)'} />
                  <span style={{
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: active ? 400 : 300,
                    fontSize: '13px',
                    color: active ? 'white' : 'rgba(255,255,255,0.55)',
                    flex: 1,
                  }}>
                    {label}
                  </span>
                  {active && <ChevronRight size={11} color="rgba(255,255,255,0.3)" />}
                </Link>
              </li>
            )
          })}
        </ul>

        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" target="_blank" onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '4px', textDecoration: 'none' }}>
            <Store size={15} color="rgba(255,255,255,0.3)" />
            <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
              View Store
            </span>
          </Link>
          <Link href="/pos" onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '4px', textDecoration: 'none' }}>
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
              {initials}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
              {profile?.full_name ?? 'Admin'}
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize', margin: 0 }}>
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
  )

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:flex" style={{ height: '100%' }}>
        {sidebarContent}
      </div>

      {/* Mobile: slide-in drawer */}
      {mobileOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(44,36,32,0.6)', zIndex: 40 }}
          />
          {/* Drawer */}
          <div style={{ position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 50 }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
