import type { Metadata, Viewport } from 'next'
import './clearance.css'

// Standalone layout: no main-site navbar or footer, so nothing on this page
// links into the rest of the store. Search engines are told to stay away.
export const metadata: Metadata = {
  title: { absolute: 'Clearance Sale | Discount Beauty Barr' },
  description: 'Ninety-five beauty products marked down for a few days only, 16 to 19 October. Palettes, primers, setting sprays, serums and body lotions.',
  robots: { index: false, follow: false, nocache: true },
  openGraph: {
    title: 'Clearance Sale | Discount Beauty Barr',
    description: 'Big clearance prices, 16 to 19 October. While stock lasts.',
    images: ['/clearance/logo.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#130E0B',
}

export default function ClearanceLayout({ children }: { children: React.ReactNode }) {
  return <div className="clr">{children}</div>
}
