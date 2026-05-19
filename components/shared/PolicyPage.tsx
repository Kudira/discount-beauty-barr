import { PageHero } from '@/components/shared/PageHero'

interface PolicySection {
  heading: string
  body: string | string[]
}

interface PolicyPageProps {
  eyebrow: string
  title: string
  subtitle?: string
  lastUpdated: string
  sections: PolicySection[]
  imageUrl?: string | null
}

export function PolicyPage({ eyebrow, title, subtitle, lastUpdated, sections, imageUrl }: PolicyPageProps) {
  return (
    <>
      <PageHero
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        imageUrl={imageUrl}
      />

      <section className="py-16 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="mb-12 pb-6 border-b border-[#E8DDD4]"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 300, fontSize: '14px', color: '#B76E79' }}>
          Last updated: {lastUpdated}
        </p>

        <div className="flex flex-col gap-10">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="mb-4"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '24px', color: '#2C2420' }}>
                {section.heading}
              </h2>
              {Array.isArray(section.body) ? (
                <ul className="flex flex-col gap-2 list-none">
                  {section.body.map((item, j) => (
                    <li key={j} className="flex gap-3"
                      style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '15px', lineHeight: 1.8, color: '#8C7B74' }}>
                      <span style={{ color: '#E8B4A0', marginTop: '2px', flexShrink: 0 }}>✦</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '15px', lineHeight: 1.8, color: '#8C7B74' }}>
                  {section.body}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
