import type { Metadata } from 'next'
import { getPageContent } from '@/lib/getPageContent'
import { PolicyPage } from '@/components/shared/PolicyPage'

export const metadata: Metadata = { title: 'Return Policy' }

export default async function ReturnsPage() {
  const content = await getPageContent('returns')
  return (
    <PolicyPage
      eyebrow="Policies"
      title="Return & Exchange Policy"
      subtitle="We want you to love every product you buy. If something isn't right, here's how we make it right."
      lastUpdated="May 2026"
      imageUrl={content?.banner_image_url}
      sections={[
        {
          heading: 'Returns',
          body: 'We accept returns within 7 days of purchase. Products must be unopened, unused, and in their original packaging with a valid receipt or proof of purchase. Returns can be made in person at either of our Osu or East Legon locations.',
        },
        {
          heading: 'Exchanges',
          body: 'Exchanges are accepted within 7 days for unopened products. If you\'ve purchased the wrong shade or changed your mind, bring the product along with your receipt to any of our stores and we\'ll help you find the right match.',
        },
        {
          heading: 'Damaged or Incorrect Items',
          body: [
            'Contact us within 24 hours of receiving your order with clear photos of the item.',
            'We will arrange a replacement or full refund as quickly as possible.',
            'You will not be required to return the damaged item in most cases.',
            'Refunds are processed within 3–5 business days depending on your payment method.',
          ],
        },
        {
          heading: 'Non-Returnable Items',
          body: [
            'Opened or used products (for hygiene reasons).',
            'Products purchased on final sale or marked as non-returnable.',
            'Gift cards and vouchers.',
            'Items without original packaging or proof of purchase.',
          ],
        },
        {
          heading: 'Online Order Returns',
          body: 'For online orders, please contact us at hello@discountbeautybarr.com within 7 days of delivery. We will provide instructions for returning the item. Return shipping costs are the responsibility of the customer unless the item was damaged or incorrect.',
        },
        {
          heading: 'Refund Processing',
          body: 'Refunds for card and mobile money payments are processed within 3–5 business days. Cash refunds are issued immediately in store. We will notify you by email or WhatsApp once your refund has been processed.',
        },
      ]}
    />
  )
}
