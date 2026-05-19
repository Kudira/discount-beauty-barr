import type { Metadata } from 'next'
import { getPageContent } from '@/lib/getPageContent'
import { PageHero } from '@/components/shared/PageHero'
import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react'
import { BRANCHES } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Store Locations',
  description: 'Find Discount Beauty Barr in Osu and East Legon, Accra. Get directions and opening hours.',
}

export default async function LocationsPage() {
  const content = await getPageContent('locations')
  const mapsLinks = {
    osu: 'https://maps.google.com/?q=Oxford+Street+Osu+Accra+Ghana',
    'east-legon': 'https://maps.google.com/?q=American+House+Junction+East+Legon+Accra+Ghana',
  }

  return (
    <>
      <PageHero
        eyebrow={content?.banner_eyebrow ?? 'Find Us'}
        title={content?.banner_title ?? 'Two Stores in Accra'}
        subtitle={content?.banner_subtitle ?? 'Visit us at either of our locations — our beauty experts are always ready to help.'}
        imageUrl={content?.banner_image_url}
        ctaText={content?.banner_cta_text}
        ctaHref={content?.banner_cta_href}
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {BRANCHES.map((branch) => (
              <div
                key={branch.id}
                className="flex flex-col"
                style={{ border: '1px solid #E8DDD4', background: 'white' }}
              >
                {/* Map placeholder */}
                <div
                  className="w-full h-56 flex flex-col items-center justify-center gap-2 relative overflow-hidden"
                  style={{ background: 'linear-gradient(145deg, #F2EDE8, #E8DDD4)' }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'white', border: '1px solid #D4C5B8' }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: '#B76E79' }} />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      fontSize: '13px',
                      color: '#8C7B74',
                    }}
                  >
                    {branch.name}
                  </span>
                  <a
                    href={mapsLinks[branch.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5"
                    style={{
                      background: 'white',
                      border: '1px solid #D4C5B8',
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 300,
                      fontSize: '11px',
                      letterSpacing: '0.08em',
                      color: '#2C2420',
                      textDecoration: 'none',
                    }}
                  >
                    <Navigation className="w-3 h-3" style={{ color: '#B76E79' }} />
                    Open in Maps
                  </a>
                </div>

                {/* Branch details */}
                <div className="p-8 flex flex-col gap-5">
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 400,
                      fontSize: '28px',
                      color: '#2C2420',
                    }}
                  >
                    {branch.name}
                  </h2>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3 items-start">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#B76E79' }} />
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', lineHeight: 1.6 }}>
                        {branch.address}
                      </span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <Phone className="w-4 h-4 flex-shrink-0" style={{ color: '#B76E79' }} />
                      <a
                        href={`tel:${branch.phone}`}
                        style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', textDecoration: 'none' }}
                      >
                        {branch.phone}
                      </a>
                    </div>
                    <div className="flex gap-3 items-center">
                      <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#B76E79' }} />
                      <a
                        href={`mailto:${branch.email}`}
                        style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', textDecoration: 'none' }}
                      >
                        {branch.email}
                      </a>
                    </div>
                    <div className="flex gap-3 items-start">
                      <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#B76E79' }} />
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', lineHeight: 1.6 }}>
                        {branch.openingHours}
                      </span>
                    </div>
                  </div>

                  <a
                    href={mapsLinks[branch.id]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-2 self-start"
                    style={{
                      padding: '12px 28px',
                      background: '#2C2420',
                      color: 'white',
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      fontWeight: 300,
                      fontSize: '15px',
                      letterSpacing: '0.06em',
                      textDecoration: 'none',
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery note */}
          <div
            className="mt-10 p-6 text-center"
            style={{ background: '#F2EDE8', border: '1px solid #E8DDD4' }}
          >
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '16px',
                color: '#8C7B74',
                lineHeight: 1.8,
              }}
            >
              Can&apos;t make it in store? Shop online and enjoy free delivery on orders over{' '}
              <span style={{ color: '#B76E79' }}>GHS 300</span> across Accra.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
