import type { Metadata } from 'next'
import { getPageContent } from '@/lib/getPageContent'
import { PageHero } from '@/components/shared/PageHero'
import { FaqAccordion } from '@/components/shared/FaqAccordion'

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about Discount Beauty Barr — orders, delivery, returns, and more.',
}

const faqCategories = [
  {
    category: 'Shopping & Orders',
    items: [
      {
        question: 'Are all your products authentic?',
        answer: 'Absolutely. Every single product at Discount Beauty Barr is 100% genuine. We source exclusively from authorised distributors and trusted suppliers. Authenticity is non-negotiable for us.',
      },
      {
        question: 'Can I shop online and pick up in store?',
        answer: 'Yes! We offer a click-and-collect option. Simply place your order online, select your preferred branch (Osu or East Legon) at checkout, and we\'ll have it ready for you — usually within the same business day.',
      },
      {
        question: 'Do you offer gift wrapping?',
        answer: 'Yes, we offer beautiful gift wrapping at a small additional cost. You can select this option at checkout. Perfect for birthdays, anniversaries, or treating someone special.',
      },
      {
        question: 'How do I know which shade is right for me?',
        answer: 'Our in-store beauty experts are always happy to help you find your perfect match. You can also reach us via WhatsApp with photos, and we\'ll guide you to the best shade for your skin tone.',
      },
    ],
  },
  {
    category: 'Delivery & Shipping',
    items: [
      {
        question: 'Do you deliver across Accra?',
        answer: 'Yes, we deliver across Accra. Delivery fees apply based on your location. Orders over GHS 300 qualify for free delivery within Accra. We\'re also working on expanding delivery to other regions.',
      },
      {
        question: 'How long does delivery take?',
        answer: 'Standard delivery within Accra takes 1–3 business days. For same-day delivery, place your order before 12pm and we\'ll do our best to get it to you the same day (subject to availability).',
      },
      {
        question: 'How much does delivery cost?',
        answer: 'Delivery is GHS 30 for most areas within Accra. Orders over GHS 300 qualify for free delivery. You\'ll see the exact delivery fee at checkout based on your address.',
      },
    ],
  },
  {
    category: 'Returns & Refunds',
    items: [
      {
        question: 'Can I return a product?',
        answer: 'We accept returns within 7 days of purchase, provided the product is unopened, unused, and in its original packaging. Please bring your receipt or proof of purchase. See our full Return Policy for details.',
      },
      {
        question: 'What if I received a damaged or wrong item?',
        answer: 'We sincerely apologise if this happens. Please contact us within 24 hours of receiving your order with photos of the item. We will arrange a replacement or full refund immediately — no questions asked.',
      },
      {
        question: 'Can I exchange a product for a different shade?',
        answer: 'Yes, exchanges are accepted within 7 days for unopened products. Visit either of our stores with your receipt and we\'ll be happy to help you find the right shade.',
      },
    ],
  },
  {
    category: 'Payments',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept cash, card payments (Visa & Mastercard), and mobile money (MTN MoMo, Vodafone Cash, AirtelTigo Money) in store. Online orders are processed securely via Paystack.',
      },
      {
        question: 'Is it safe to pay online?',
        answer: 'Absolutely. All online payments are processed through Paystack, Ghana\'s most trusted payment gateway. Your card details are never stored on our servers.',
      },
    ],
  },
]

export default async function FaqPage() {
  const content = await getPageContent('faq')
  return (
    <>
      <PageHero
        eyebrow={content?.banner_eyebrow ?? 'Help Centre'}
        title={content?.banner_title ?? 'Frequently Asked Questions'}
        subtitle={content?.banner_subtitle ?? 'Everything you need to know about shopping with Discount Beauty Barr.'}
        imageUrl={content?.banner_image_url}
        ctaText={content?.banner_cta_text}
        ctaHref={content?.banner_cta_href}
      />

      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-14">
            {faqCategories.map((cat) => (
              <div key={cat.category}>
                <h2
                  className="mb-6"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 400,
                    fontSize: '26px',
                    color: '#2C2420',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #E8DDD4',
                  }}
                >
                  {cat.category}
                </h2>
                <FaqAccordion items={cat.items} />
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div
            className="mt-16 p-8 text-center"
            style={{ background: '#F2EDE8', border: '1px solid #E8DDD4' }}
          >
            <h3
              className="mb-3"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '24px', color: '#2C2420' }}
            >
              Still have questions?
            </h3>
            <p
              className="mb-6"
              style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', lineHeight: 1.7 }}
            >
              Our team is happy to help. Reach out and we&apos;ll get back to you within 24 hours.
            </p>
            <a
              href="/contact"
              style={{
                padding: '12px 32px',
                background: '#B76E79',
                color: 'white',
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '15px',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
