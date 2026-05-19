import type { Metadata } from 'next'
import { getPageContent } from '@/lib/getPageContent'
import { PolicyPage } from '@/components/shared/PolicyPage'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default async function PrivacyPage() {
  const content = await getPageContent('privacy')
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal information."
      lastUpdated="May 2026"
      imageUrl={content?.banner_image_url}
      sections={[
        {
          heading: 'Information We Collect',
          body: [
            'Name, email address, and phone number when you create an account or place an order.',
            'Delivery address and payment information (payment details are processed securely by Paystack and never stored on our servers).',
            'Browsing behaviour on our website, including pages visited and products viewed.',
            'Communications you send us via contact forms, email, or WhatsApp.',
          ],
        },
        {
          heading: 'How We Use Your Information',
          body: [
            'To process and fulfil your orders, and send you order confirmations and updates.',
            'To respond to your enquiries and provide customer support.',
            'To send you promotional emails and offers — only if you have opted in.',
            'To improve our website, products, and services based on your feedback.',
            'To comply with legal obligations as required under Ghanaian law.',
          ],
        },
        {
          heading: 'How We Protect Your Information',
          body: 'We take the security of your personal data seriously. Our website uses SSL encryption, and all payment transactions are processed through Paystack\'s secure, PCI-compliant infrastructure. We do not sell, rent, or share your personal information with third parties for marketing purposes.',
        },
        {
          heading: 'Cookies',
          body: 'Our website uses cookies to improve your browsing experience and remember your preferences. You can control cookie settings through your browser. Disabling cookies may affect some features of our website.',
        },
        {
          heading: 'Your Rights',
          body: [
            'Access the personal information we hold about you.',
            'Request correction of inaccurate information.',
            'Request deletion of your account and associated data.',
            'Opt out of marketing communications at any time.',
          ],
        },
        {
          heading: 'Contact Us',
          body: 'If you have any questions about this Privacy Policy or how we handle your data, please contact us at hello@discountbeautybarr.com or visit either of our stores in Osu or East Legon.',
        },
      ]}
    />
  )
}
