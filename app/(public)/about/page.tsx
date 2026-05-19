import type { Metadata } from 'next'
import { PageHero } from '@/components/shared/PageHero'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Heart, Award, Users, MapPin } from 'lucide-react'
import { getPageContent } from '@/lib/getPageContent'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Meet the woman behind Discount Beauty Barr — Sadya. Seven years of bringing premium beauty to Accra.',
}

const values = [
  { icon: <Heart className="w-5 h-5" />, title: 'Passion for Beauty', desc: 'We believe every woman deserves access to products that make her feel confident, radiant, and celebrated.' },
  { icon: <Award className="w-5 h-5" />, title: 'Authenticity First', desc: 'Every product on our shelves is 100% genuine. We source directly from trusted suppliers and authorised distributors.' },
  { icon: <Users className="w-5 h-5" />, title: 'Community Rooted', desc: 'Born and built in Accra, we understand the beauty needs of Ghanaian women and celebrate every skin tone.' },
  { icon: <MapPin className="w-5 h-5" />, title: 'Always Accessible', desc: 'Premium beauty should never be out of reach. Two stores, online shopping, and real people ready to help.' },
]

export default async function AboutPage() {
  const content = await getPageContent('about')
  return (
    <>
      <PageHero
        eyebrow={content?.banner_eyebrow ?? 'Our Story'}
        title={content?.banner_title ?? 'More Than a Beauty Store'}
        subtitle={content?.banner_subtitle ?? 'Seven years of passion, authenticity, and making premium beauty accessible to every woman in Accra.'}
        imageUrl={content?.banner_image_url}
        ctaText={content?.banner_cta_text}
        ctaHref={content?.banner_cta_href}
      />

      {/* ── Founder section ─────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Founder image placeholder */}
            <div className="relative">
              <div className="w-full aspect-[3/4] max-w-sm mx-auto lg:mx-0 flex flex-col items-center justify-center gap-4"
                style={{ background: 'linear-gradient(145deg, #F2EDE8, #E8DDD4)', border: '1px solid #D4C5B8' }}>
                <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: '#D4C5B8' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" fill="#B76E79" opacity="0.4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#B76E79" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                  </svg>
                </div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '13px', color: '#B76E79', letterSpacing: '0.06em' }}>
                  Photo coming soon
                </span>
              </div>
              <div className="absolute -bottom-4 -right-4 w-32 h-32 -z-10 hidden lg:block" style={{ background: '#F2EDE8', border: '1px solid #E8DDD4' }} />
            </div>

            {/* Founder story */}
            <div className="flex flex-col gap-6">
              <div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '14px', letterSpacing: '0.1em', color: '#B76E79' }}>
                  Meet the Founder
                </span>
                <h2 className="mt-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '42px', color: '#2C2420', lineHeight: 1.1 }}>
                  Sadya
                </h2>
              </div>
              {[
                'What started as a deep love for beauty and a desire to make premium products accessible to women in Accra has grown into something truly special. Sadya founded Discount Beauty Barr over seven years ago with a simple but powerful belief — that every woman deserves to feel beautiful without breaking the bank.',
                'From a single location to two thriving stores — in Osu and East Legon — Sadya has built Discount Beauty Barr into Accra\'s most trusted destination for authentic makeup and skincare. Her hands-on approach, encyclopedic knowledge of beauty, and genuine care for her customers is what sets this brand apart.',
              ].map((text, i) => (
                <p key={i} style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '15px', lineHeight: 1.85, color: '#8C7B74' }}>
                  {text}
                </p>
              ))}
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '15px', lineHeight: 1.85, color: '#8C7B74' }}>
                &ldquo;Beauty is not a luxury — it&apos;s a form of self-expression. My mission has always been to make sure that every woman who walks through our doors leaves feeling seen, valued, and beautiful.&rdquo;
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-2">
                {[{ number: '7+', label: 'Years in Business' }, { number: '2', label: 'Accra Locations' }, { number: '500+', label: 'Products' }].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center px-6 py-4" style={{ background: '#FAF7F4', border: '1px solid #E8DDD4' }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '32px', color: '#B76E79', lineHeight: 1 }}>{stat.number}</span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.12em', color: '#8C7B74', marginTop: '4px' }}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #D4C5B8, transparent)' }} />
      </div>

      {/* Values */}
      <section className="py-20" style={{ background: '#FAF7F4' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="What We Stand For" title="Our Values"
            subtitle="Everything we do is guided by a commitment to authenticity, accessibility, and the women we serve." align="center" />
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="flex flex-col gap-4 p-7" style={{ background: 'white', border: '1px solid #E8DDD4' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#F2EDE8', color: '#B76E79' }}>{v.icon}</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420' }}>{v.title}</h3>
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', lineHeight: 1.8, color: '#8C7B74' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ background: '#2C2420' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '36px', color: 'white' }}>Come Say Hello</h2>
          <p className="mb-8 mx-auto" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '15px', color: 'rgba(255,255,255,0.6)', maxWidth: '420px', lineHeight: 1.8 }}>
            Visit us at Osu or East Legon — our team is always ready to help you find exactly what you need.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/locations" style={{ padding: '13px 32px', background: '#B76E79', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none' }}>
              Find Our Stores
            </a>
            <a href="/contact" style={{ padding: '13px 32px', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none' }}>
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
