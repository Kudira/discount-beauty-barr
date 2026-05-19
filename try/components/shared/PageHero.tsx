interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  imageUrl?: string | null
  ctaText?: string | null
  ctaHref?: string | null
}

export function PageHero({ eyebrow, title, subtitle, imageUrl, ctaText, ctaHref }: PageHeroProps) {
  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        background: imageUrl
          ? 'transparent'
          : 'linear-gradient(135deg, #FAF7F4 0%, #F2EDE8 60%, #E8DDD4 100%)',
      }}
    >
      {/* Banner image */}
      {imageUrl && (
        <>
          <img
            src={imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
          {/* Dark overlay so text stays readable */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, rgba(44,36,32,0.65) 0%, rgba(44,36,32,0.3) 100%)' }}
          />
        </>
      )}

      {/* Decorative glow — only when no image */}
      {!imageUrl && (
        <div
          className="absolute top-[-20%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,180,160,0.2), transparent 70%)' }}
        />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {eyebrow && (
          <span
            className="inline-block mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic', fontWeight: 300, fontSize: '14px',
              letterSpacing: '0.1em',
              color: imageUrl ? 'rgba(232,180,160,0.9)' : '#B76E79',
            }}
          >
            {eyebrow}
          </span>
        )}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif", fontWeight: 300,
            color: imageUrl ? 'white' : '#2C2420',
            lineHeight: 1.1,
            marginBottom: subtitle ? '1rem' : 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="max-w-2xl mx-auto mt-4"
            style={{
              fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '16px',
              lineHeight: 1.8,
              color: imageUrl ? 'rgba(255,255,255,0.8)' : '#8C7B74',
            }}
          >
            {subtitle}
          </p>
        )}
        {/* CTA button */}
        {ctaText && ctaHref && (
          <a
            href={ctaHref}
            className="inline-flex items-center gap-2 mt-8"
            style={{
              padding: '13px 32px',
              background: '#B76E79', color: 'white',
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none',
              borderRadius: '2px',
            }}
          >
            {ctaText}
          </a>
        )}
        {/* Decorative line */}
        <div
          className="mx-auto mt-6"
          style={{
            width: '48px', height: '1px',
            background: imageUrl
              ? 'rgba(232,180,160,0.6)'
              : 'linear-gradient(to right, #E8B4A0, #B76E79)',
          }}
        />
      </div>
    </section>
  )
}
