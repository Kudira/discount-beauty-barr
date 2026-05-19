import type { Metadata } from 'next'
import { getPageContent } from '@/lib/getPageContent'
import { PageHero } from '@/components/shared/PageHero'
import { ContactForm } from '@/components/forms/ContactForm'
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import { BRANCHES, APP_EMAIL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with Discount Beauty Barr. Visit us in Osu or East Legon, or send us a message.',
}

export default async function ContactPage() {
  const content = await getPageContent('contact')
  return (
    <>
      <PageHero
        eyebrow={content?.banner_eyebrow ?? 'Get in Touch'}
        title={content?.banner_title ?? "We'd Love to Hear From You"}
        subtitle={content?.banner_subtitle ?? "Whether you have a question about a product, an order, or just want to say hi — we're always here."}
        imageUrl={content?.banner_image_url}
        ctaText={content?.banner_cta_text}
        ctaHref={content?.banner_cta_href}
      />

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">

            {/* ── Left: Info ────────────────────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-10">

              {/* WhatsApp CTA */}
              <div
                className="flex items-start gap-4 p-6"
                style={{ background: '#F2EDE8', border: '1px solid #E8DDD4' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#B76E79' }}
                >
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 400,
                      fontSize: '18px',
                      color: '#2C2420',
                      marginBottom: '4px',
                    }}
                  >
                    Chat on WhatsApp
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontWeight: 300,
                      fontSize: '13px',
                      color: '#8C7B74',
                      lineHeight: 1.7,
                      marginBottom: '10px',
                    }}
                  >
                    For the fastest response, message us directly on WhatsApp.
                  </p>
                  <a
                    href="https://wa.me/233XXXXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontStyle: 'italic',
                      fontSize: '14px',
                      color: '#B76E79',
                      textDecoration: 'underline',
                      textUnderlineOffset: '3px',
                    }}
                  >
                    Start a conversation →
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: '12px',
                    letterSpacing: '0.1em',
                    color: '#B76E79',
                  }}
                >
                  Email Us
                </span>
                <a
                  href={`mailto:${APP_EMAIL}`}
                  className="flex items-center gap-2"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 300,
                    fontSize: '14px',
                    color: '#2C2420',
                    textDecoration: 'none',
                  }}
                >
                  <Mail className="w-4 h-4" style={{ color: '#B76E79' }} />
                  {APP_EMAIL}
                </a>
              </div>

              {/* Branch info */}
              {BRANCHES.map((branch) => (
                <div key={branch.id} className="flex flex-col gap-3">
                  <h4
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 400,
                      fontSize: '20px',
                      color: '#2C2420',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #E8DDD4',
                    }}
                  >
                    {branch.name}
                  </h4>
                  <div className="flex flex-col gap-2">
                    <span className="flex gap-2 items-start">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#B76E79' }} />
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', lineHeight: 1.6 }}>
                        {branch.address}
                      </span>
                    </span>
                    <span className="flex gap-2 items-center">
                      <Phone className="w-4 h-4 flex-shrink-0" style={{ color: '#B76E79' }} />
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74' }}>
                        {branch.phone}
                      </span>
                    </span>
                    <span className="flex gap-2 items-start">
                      <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#B76E79' }} />
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', lineHeight: 1.6 }}>
                        {branch.openingHours}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Right: Form ───────────────────────────────────────────── */}
            <div className="lg:col-span-3">
              <div
                className="p-8 sm:p-10"
                style={{ background: '#FAF7F4', border: '1px solid #E8DDD4' }}
              >
                <h2
                  className="mb-2"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontSize: '28px',
                    color: '#2C2420',
                  }}
                >
                  Send Us a Message
                </h2>
                <p
                  className="mb-8"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 300,
                    fontSize: '14px',
                    color: '#8C7B74',
                    lineHeight: 1.7,
                  }}
                >
                  Fill in the form below and we&apos;ll get back to you within 24 hours.
                </p>
                <ContactForm />
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
