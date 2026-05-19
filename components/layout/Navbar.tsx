'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Search, User, Menu, X, MapPin, LogOut } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { NAV_LINKS } from '@/lib/constants'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'


function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setOpen(false)
      setQuery('')
    }
  }

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  if (!open) return (
    <button aria-label="Search" onClick={() => setOpen(true)}
      className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-[#F2EDE8] transition-all"
      style={{ color: '#2C2420', background: 'none', border: 'none', cursor: 'pointer' }}>
      <Search className="w-4 h-4" />
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="hidden sm:flex items-center gap-1">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => { setTimeout(() => { if (!query) setOpen(false) }, 200) }}
        placeholder="Search products…"
        style={{ padding: '6px 12px', border: '1px solid #D4C5B8', borderRadius: '2px', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', outline: 'none', width: '180px' }}
      />
      <button type="submit" style={{ background: '#2C2420', border: 'none', borderRadius: '2px', padding: '6px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
        <Search size={14} />
      </button>
    </form>
  )
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount } = useCart()
  const { user, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [mobileOpen])

  return (
    <>
      {/* Announcement bar */}
      <div style={{ background: '#2C2420' }} className="py-2 px-4">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#E8B4A0' }} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '13px', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.75)' }}>
            Now open in <span style={{ color: '#E8B4A0' }}>Osu</span> &amp; <span style={{ color: '#E8B4A0' }}>East Legon</span> · Free delivery over GHS 300
          </span>
        </div>
      </div>

      {/* Main navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, width: '100%', background: '#FAF7F4', borderBottom: '1px solid #E8DDD4', boxShadow: isScrolled ? '0 1px 8px rgba(44,36,32,0.06)' : 'none', transition: 'box-shadow 0.3s' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Logo size="md" />

            <ul className="hidden lg:flex items-center gap-8 list-none">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '15px', letterSpacing: '0.08em', color: '#2C2420', textDecoration: 'none' }}
                    className="hover:text-[#B76E79] transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <SearchBar />

              {/* Account — shows user initial if logged in */}
              <Link href={user ? '/account' : '/login'} aria-label="Account"
                className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-[#F2EDE8] transition-all"
                style={{ color: '#2C2420', textDecoration: 'none', fontSize: '12px', fontFamily: "'Jost', sans-serif", fontWeight: 500 }}>
                {user ? (
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ background: '#B76E79' }}>
                    {user.email?.[0].toUpperCase()}
                  </span>
                ) : (
                  <User className="w-4 h-4" />
                )}
              </Link>

              <Link href="/cart" aria-label="Cart" className="relative flex w-9 h-9 items-center justify-center rounded-full hover:bg-[#F2EDE8] transition-all" style={{ color: '#2C2420' }}>
                <ShoppingBag className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-white"
                    style={{ background: '#B76E79', fontSize: '9px', fontFamily: "'Jost', sans-serif" }}>
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              <button aria-label={mobileOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F2EDE8] transition-all ml-1" style={{ color: '#2C2420' }}>
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#FAF7F4', display: 'flex', flexDirection: 'column', transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s ease', visibility: mobileOpen ? 'visible' : 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '64px', borderBottom: '1px solid #E8DDD4', flexShrink: 0 }}>
          <Logo size="md" />
          <button aria-label="Close menu" onClick={() => setMobileOpen(false)}
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#2C2420' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {NAV_LINKS.map((link) => (
              <li key={link.href} style={{ borderBottom: '1px solid #E8DDD4' }}>
                <Link href={link.href} onClick={() => setMobileOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', padding: '18px 0', fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '24px', letterSpacing: '0.03em', color: '#2C2420', textDecoration: 'none' }}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ padding: '20px 24px', borderTop: '1px solid #E8DDD4', display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
          <Link href={user ? '/account' : '/login'} onClick={() => setMobileOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '16px', color: '#8C7B74', textDecoration: 'none' }}>
            <User size={16} color="#B76E79" />
            {user ? 'My Account' : 'Sign In'}
          </Link>
          {user && (
            <button onClick={() => { signOut(); setMobileOpen(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '16px', color: '#8C7B74', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <LogOut size={16} color="#B76E79" />
              Sign Out
            </button>
          )}
          <Link href="/locations" onClick={() => setMobileOpen(false)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '16px', color: '#8C7B74', textDecoration: 'none' }}>
            <MapPin size={16} color="#B76E79" /> Find a Store
          </Link>
        </div>
      </div>
    </>
  )
}
