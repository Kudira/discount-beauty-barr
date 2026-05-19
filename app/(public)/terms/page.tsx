import type { Metadata } from 'next'
import { getPageContent } from '@/lib/getPageContent'
import { PolicyPage } from '@/components/shared/PolicyPage'

export const metadata: Metadata = { title: 'Terms of Service' }

export default async function TermsPage() {
  const content = await getPageContent('terms')
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="Please read these terms carefully before using our website or making a purchase."
      lastUpdated="May 2026"
      imageUrl={content?.banner_image_url}
      sections={[
        {
          heading: 'Acceptance of Terms',
          body: 'By accessing our website or making a purchase from Discount Beauty Barr, you agree to be bound by these Terms of Service. If you do not agree, please do not use our website or services.',
        },
        {
          heading: 'Products & Pricing',
          body: [
            'All prices are displayed in Ghana Cedis (GHS) and include applicable taxes.',
            'We reserve the right to change prices at any time without prior notice.',
            'Product images are for illustration purposes — actual colours may vary slightly due to screen settings.',
            'We reserve the right to limit quantities or refuse orders at our discretion.',
          ],
        },
        {
          heading: 'Orders & Payment',
          body: [
            'An order confirmation does not guarantee product availability.',
            'We reserve the right to cancel orders if a product becomes unavailable.',
            'Payment must be completed in full before an order is dispatched.',
            'All payments are processed securely through Paystack.',
          ],
        },
        {
          heading: 'Intellectual Property',
          body: 'All content on this website — including text, images, logos, and design — is the property of Discount Beauty Barr and may not be copied, reproduced, or used without our express written permission.',
        },
        {
          heading: 'Limitation of Liability',
          body: 'Discount Beauty Barr shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products. Our liability is limited to the value of the products purchased.',
        },
        {
          heading: 'Governing Law',
          body: 'These Terms of Service are governed by the laws of the Republic of Ghana. Any disputes shall be subject to the exclusive jurisdiction of the courts of Ghana.',
        },
        {
          heading: 'Changes to Terms',
          body: 'We reserve the right to update these Terms of Service at any time. Changes will be posted on this page with an updated date. Continued use of our website after changes constitutes acceptance of the new terms.',
        },
        {
          heading: 'Contact',
          body: 'For any questions about these terms, please contact us at hello@discountbeautybarr.com.',
        },
      ]}
    />
  )
}
