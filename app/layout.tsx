import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'

export const metadata: Metadata = {
  title: {
    default: 'Discount Beauty Barr | Premium Beauty in Accra',
    template: '%s | Discount Beauty Barr',
  },
  description: 'Premium makeup and skincare at accessible prices. Shop online or visit us at our Osu and East Legon stores in Accra, Ghana.',
  keywords: ['beauty store accra', 'makeup ghana', 'skincare accra', 'discount beauty', 'osu beauty store', 'east legon beauty'],
  authors: [{ name: 'Discount Beauty Barr' }],
  creator: 'Discount Beauty Barr',
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    siteName: 'Discount Beauty Barr',
    title: 'Discount Beauty Barr | Premium Beauty in Accra',
    description: 'Premium makeup and skincare at accessible prices. Two locations in Accra: Osu & East Legon.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discount Beauty Barr',
    description: 'Premium beauty. Accessible prices. Accra, Ghana.',
  },
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#B76E79',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased" style={{ background: '#FAF7F4' }}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
