import type { Branch } from '@/types'

export const APP_NAME = 'Discount Beauty Barr'
export const APP_TAGLINE = 'Premium Beauty. Accessible Prices.'
export const APP_EMAIL = 'hello@discountbeautybar.com'
export const APP_PHONE = '+233 XX XXX XXXX'

export const BRANCHES: Branch[] = [
  {
    id: 'osu',
    name: 'Osu Branch',
    address: 'Oxford Street, Osu, Accra',
    phone: '+233 XX XXX XXXX',
    email: 'osu@discountbeautybar.com',
    openingHours: 'Mon – Sat: 9am – 7pm | Sun: 11am – 5pm',
  },
  {
    id: 'east-legon',
    name: 'East Legon Branch',
    address: 'American House Junction, East Legon, Accra',
    phone: '+233 XX XXX XXXX',
    email: 'eastlegon@discountbeautybar.com',
    openingHours: 'Mon – Sat: 9am – 7pm | Sun: 11am – 5pm',
  },
]

export const NAV_LINKS = [
  { label: 'Shop', href: '/shop' },
  { label: 'Skincare', href: '/shop?category=skincare' },
  { label: 'Makeup', href: '/shop?category=makeup' },
  { label: 'Brands', href: '/brands' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export const FOOTER_LINKS = {
  shop: [
    { label: 'All Products', href: '/shop' },
    { label: 'Skincare', href: '/shop?category=skincare' },
    { label: 'Makeup', href: '/shop?category=makeup' },
    { label: 'Haircare', href: '/shop?category=haircare' },
    { label: 'Fragrance', href: '/shop?category=fragrance' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Store Locations', href: '/locations' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'FAQ', href: '/faq' },
  ],
  policies: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Return Policy', href: '/returns' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

export const PRODUCT_CATEGORIES = [
  { value: 'skincare', label: 'Skincare' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'haircare', label: 'Haircare' },
  { value: 'fragrance', label: 'Fragrance' },
  { value: 'tools', label: 'Tools & Accessories' },
  { value: 'body', label: 'Body Care' },
] as const

export const LOW_STOCK_THRESHOLD = 5
export const DELIVERY_FEE = 30  // GHS
export const FREE_DELIVERY_MINIMUM = 300  // GHS
