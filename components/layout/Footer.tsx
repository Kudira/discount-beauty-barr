import Link from 'next/link'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { BRANCHES, FOOTER_LINKS, APP_EMAIL } from '@/lib/constants'

const serif = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 300,
} as const

const serifItalic = {
  fontFamily: "'Cormorant Garamond', serif",
  fontStyle: 'italic' as const,
  fontWeight: 300,
} as const

// ── Inline SVG social icons — no lucide dependency ───────────────────────────
function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.77a4.85 4.85 0 01-1.01-.08z"/>
    </svg>
  )
}

const SOCIALS = [
  { href: 'https://instagram.com', label: 'Instagram', Icon: InstagramIcon },
  { href: 'https://facebook.com',  label: 'Facebook',  Icon: FacebookIcon  },
  { href: 'https://tiktok.com',    label: 'TikTok',    Icon: TikTokIcon    },
]

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#2C2420' }}>

      {/* ── Main content ────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

          {/* Brand */}
          <div className="flex flex-col gap-5">
            <Logo variant="light" size="md" />
            <p style={{ ...serifItalic, fontSize: '15px', lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', maxWidth: '240px' }}>
              Premium beauty products at accessible prices. Your one-stop destination in Accra.
            </p>
            <div className="flex gap-3 mt-1">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-5" style={{ ...serifItalic, fontSize: '13px', letterSpacing: '0.12em', color: '#E8B4A0' }}>
              Shop
            </h4>
            <ul className="flex flex-col gap-3">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ ...serif, fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company + Policies */}
          <div>
            <h4 className="mb-5" style={{ ...serifItalic, fontSize: '13px', letterSpacing: '0.12em', color: '#E8B4A0' }}>
              Company
            </h4>
            <ul className="flex flex-col gap-3 mb-8">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ ...serif, fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="mb-5" style={{ ...serifItalic, fontSize: '13px', letterSpacing: '0.12em', color: '#E8B4A0' }}>
              Policies
            </h4>
            <ul className="flex flex-col gap-3">
              {FOOTER_LINKS.policies.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} style={{ ...serif, fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Store locations */}
          <div>
            <h4 className="mb-5" style={{ ...serifItalic, fontSize: '13px', letterSpacing: '0.12em', color: '#E8B4A0' }}>
              Our Stores
            </h4>
            <div className="flex flex-col gap-8">
              {BRANCHES.map((branch) => (
                <div key={branch.id} className="flex flex-col gap-2">
                  <h5 style={{ ...serif, fontSize: '15px', color: 'white' }}>{branch.name}</h5>
                  <address className="not-italic flex flex-col gap-2">
                    <span className="flex gap-2 items-start">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#E8B4A0' }} />
                      <span style={{ ...serif, fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{branch.address}</span>
                    </span>
                    <span className="flex gap-2 items-center">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#E8B4A0' }} />
                      <span style={{ ...serif, fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{branch.phone}</span>
                    </span>
                    <span className="flex gap-2 items-start">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: '#E8B4A0' }} />
                      <span style={{ ...serif, fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{branch.openingHours}</span>
                    </span>
                  </address>
                </div>
              ))}
              <a
                href={`mailto:${APP_EMAIL}`}
                className="flex gap-2 items-center"
                style={{ ...serif, fontSize: '13px', color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}
              >
                <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#E8B4A0' }} />
                {APP_EMAIL}
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p style={{ ...serif, fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
              © {year} Discount Beauty Barr. All rights reserved.
            </p>
            <p style={{ ...serif, fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
              Made with love in Accra, Ghana 🇬🇭
            </p>
          </div>
        </div>
      </div>

    </footer>
  )
}
