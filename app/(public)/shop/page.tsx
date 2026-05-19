import type { Metadata } from 'next'
import { PageHero } from '@/components/shared/PageHero'
import { ShopClient } from './ShopClient'
import { Suspense } from 'react'
import { getPageContent } from '@/lib/getPageContent'
import { getProducts } from '@/lib/getProducts'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse our full range of premium makeup, skincare, haircare, and fragrance at Discount Beauty Barr.',
}

export default async function ShopPage() {
  const [content, products] = await Promise.all([
    getPageContent('shop'),
    getProducts(),
  ])

  return (
    <>
      <PageHero
        eyebrow={content?.banner_eyebrow ?? 'Our Collection'}
        title={content?.banner_title ?? 'Shop All Products'}
        subtitle={content?.banner_subtitle ?? 'Premium makeup, skincare, haircare, and fragrance — curated for every complexion.'}
        imageUrl={content?.banner_image_url}
        ctaText={content?.banner_cta_text}
        ctaHref={content?.banner_cta_href}
      />
      <Suspense fallback={<div className="py-20 text-center" style={{fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'18px', color:'#8C7B74'}}>Loading products…</div>}>
        <ShopClient products={products} />
      </Suspense>
    </>
  )
}
