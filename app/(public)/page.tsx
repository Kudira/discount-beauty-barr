import Link from 'next/link'
import { ShoppingBag, MapPin, Sparkles, Star } from 'lucide-react'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { ProductCard } from '@/components/shared/ProductCard'
import { getFeaturedProducts } from '@/lib/getProducts'
import { getPageContent } from '@/lib/getPageContent'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [content, featuredProducts] = await Promise.all([
    getPageContent('home'),
    getFeaturedProducts(),
  ])

  // Text with fallbacks
  const eyebrow   = content?.banner_eyebrow  ?? '✦ Premium Beauty · Accra Ghana'
  const title     = content?.banner_title    ?? 'Beauty That Speaks For Itself.'
  const subtitle  = content?.banner_subtitle ?? 'Discover premium makeup and skincare curated for every complexion. Two locations across Accra — because great beauty shouldn\'t be hard to find.'
  const imageUrl  = content?.banner_image_url
  const ctaText   = content?.banner_cta_text ?? 'Shop Now'
  const ctaHref   = content?.banner_cta_href ?? '/shop'

  return (
    <>
      <style>{`
        .btn-dark { transition: background 0.25s ease; }
        .btn-dark:hover { background: #B76E79 !important; }
        .btn-outline:hover { border-color: #B76E79 !important; color: #B76E79 !important; }
        .btn-rose:hover { background: #9A5560 !important; }
        .link-rose { color: #B76E79; text-decoration: underline; text-underline-offset: 4px; transition: opacity 0.2s; }
        .link-rose:hover { opacity: 0.7; }
        .phase-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .phase-card:hover { border-color: #E8B4A0 !important; box-shadow: 0 4px 20px rgba(232,180,160,0.15); }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[88vh] flex items-center overflow-hidden"
        style={{
          background: imageUrl
            ? 'transparent'
            : 'linear-gradient(135deg, #FAF7F4 0%, #F2EDE8 55%, #E8DDD4 100%)',
        }}
      >
        {/* Banner image */}
        {imageUrl && (
          <>
            <img src={imageUrl} alt="" aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to right, rgba(44,36,32,0.7) 0%, rgba(44,36,32,0.3) 100%)' }} />
          </>
        )}

        {/* Decorative glows — only without image */}
        {!imageUrl && (
          <>
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(232,180,160,0.25), transparent 70%)' }} />
            <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(183,110,121,0.12), transparent 70%)' }} />
          </>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <span className="inline-block mb-6" style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontWeight: 300, fontSize: '15px', letterSpacing: '0.08em',
              color: imageUrl ? 'rgba(232,180,160,0.9)' : '#B76E79',
            }}>
              {eyebrow}
            </span>
            <h1 className="mb-6" style={{
              fontFamily: "'Cormorant Garamond', serif", fontWeight: 300,
              color: imageUrl ? 'white' : '#2C2420', lineHeight: 1.1,
            }}>
              {title}
            </h1>
            <p className="mb-10 max-w-lg" style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              fontSize: '17px', lineHeight: 1.75,
              color: imageUrl ? 'rgba(255,255,255,0.85)' : '#8C7B74',
            }}>
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href={ctaHref} className="btn-dark inline-flex items-center gap-2"
                style={{
                  padding: '14px 32px',
                  background: imageUrl ? '#B76E79' : '#2C2420',
                  color: 'white',
                  fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                  fontWeight: 300, fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none',
                }}>
                <ShoppingBag className="w-4 h-4" /> {ctaText}
              </Link>
              <Link href="/locations" className="btn-outline inline-flex items-center gap-2"
                style={{
                  padding: '14px 32px',
                  border: `1px solid ${imageUrl ? 'rgba(255,255,255,0.6)' : '#2C2420'}`,
                  color: imageUrl ? 'white' : '#2C2420',
                  fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
                  fontWeight: 300, fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none',
                }}>
                <MapPin className="w-4 h-4" /> Find a Store
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values strip ────────────────────────────────────────────────── */}
      <section style={{ background: '#2C2420' }} className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { sym: '✦', text: 'Premium Brands' },
              { sym: '⟡', text: 'Authentic Products' },
              { sym: '◎', text: 'Expert Advice' },
              { sym: '⬡', text: 'Free Delivery GHS 300+' },
            ].map((item) => (
              <div key={item.text} className="flex items-center justify-center gap-2">
                <span style={{ color: '#E8B4A0', fontSize: '12px' }}>{item.sym}</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '13px', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.65)' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured products ────────────────────────────────────────────── */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Handpicked for You" title="Featured Products"
          subtitle="Our team's top picks — premium quality at prices that won't hold you back." align="center" />
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProducts.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/shop" className="link-rose" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '15px', letterSpacing: '0.06em' }}>
            Browse all products →
          </Link>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────────────────── */}
      <section className="py-16" style={{ background: '#F2EDE8' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Shop by Category" title="What Are You Looking For?" align="center" />
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Skincare', href: '/shop?category=skincare', sym: '◎' },
              { label: 'Makeup',   href: '/shop?category=makeup',   sym: '✦' },
              { label: 'Haircare', href: '/shop?category=haircare', sym: '⟡' },
              { label: 'Fragrance',href: '/shop?category=fragrance',sym: '⬡' },
              { label: 'Tools',    href: '/shop?category=tools',    sym: '◈' },
              { label: 'Body Care',href: '/shop?category=body',     sym: '❋' },
            ].map((cat) => (
              <Link key={cat.label} href={cat.href}
                className="phase-card flex flex-col items-center gap-3 py-6 px-3 bg-white border border-[#E8DDD4] text-center"
                style={{ textDecoration: 'none', borderRadius: '2px' }}>
                <span style={{ fontSize: '22px', color: '#B76E79' }}>{cat.sym}</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '15px', color: '#2C2420' }}>
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Location CTA ─────────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#FAF7F4' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeading eyebrow="Visit Us" title="Two Locations in Accra"
            subtitle="Find us at Osu and East Legon. Our beauty experts are ready to help you find exactly what you need."
            align="center" />
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link href="/locations" className="btn-rose inline-flex items-center gap-2"
              style={{ padding: '14px 36px', background: '#B76E79', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none' }}>
              <MapPin className="w-4 h-4" /> View Store Locations
            </Link>
            <Link href="/contact" className="btn-outline inline-flex items-center gap-2"
              style={{ padding: '14px 36px', border: '1px solid #2C2420', color: '#2C2420', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none' }}>
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
