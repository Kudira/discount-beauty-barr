import type { Metadata } from 'next'
import { getPageContent } from '@/lib/getPageContent'
import { PolicyPage } from '@/components/shared/PolicyPage'

export const metadata: Metadata = { title: 'Shipping Policy' }

export default async function ShippingPage() {
  const content = await getPageContent('shipping')
  return (
    <PolicyPage
      eyebrow="Policies"
      title="Shipping & Delivery"
      subtitle="Everything you need to know about getting your order to you, safely and on time."
      lastUpdated="May 2026"
      imageUrl={content?.banner_image_url}
      sections={[
        {
          heading: 'Delivery Areas',
          body: 'We currently deliver across Accra. We are actively working on expanding delivery to other regions in Ghana. If you are outside Accra, please contact us to discuss available options.',
        },
        {
          heading: 'Delivery Fees',
          body: [
            'Standard delivery within Accra: GHS 30.',
            'Free delivery on all orders over GHS 300.',
            'Same-day delivery (where available): GHS 50 — order before 12pm.',
            'Click & Collect from either store: Free.',
          ],
        },
        {
          heading: 'Delivery Timeframes',
          body: [
            'Standard delivery: 1–3 business days.',
            'Same-day delivery: Order before 12pm, delivered by 6pm (subject to availability).',
            'Click & Collect: Ready within the same business day in most cases.',
            'Public holidays may affect delivery times.',
          ],
        },
        {
          heading: 'Order Processing',
          body: 'Orders are processed Monday to Saturday, 9am–5pm. Orders placed on Sundays or public holidays will be processed the next business day. You will receive an order confirmation email immediately after purchase, and a dispatch notification once your order is on its way.',
        },
        {
          heading: 'Packaging',
          body: 'All orders are carefully packed to ensure products arrive in perfect condition. Fragile items such as glass bottles and palettes are given extra protective packaging. We use discreet, branded packaging that keeps your products safe.',
        },
        {
          heading: 'Failed Deliveries',
          body: 'If a delivery attempt is unsuccessful, our courier will contact you to arrange a redelivery. After two failed attempts, the order will be returned to our store and you will need to arrange collection or pay a redelivery fee.',
        },
      ]}
    />
  )
}
