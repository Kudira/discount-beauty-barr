'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AdminSidebar } from '@/components/dashboard/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F4F2' }}>
      {/* Sidebar — hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex">
        <AdminSidebar />
      </div>

      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: 'white', borderColor: '#E8DDD4' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            style={{ color: '#2C2420', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Menu size={20} />
          </button>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '18px', color: '#2C2420' }}>
            Admin Panel
          </span>
        </div>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
