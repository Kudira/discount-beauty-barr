import type { Metadata } from 'next'
import { PageHero } from '@/components/shared/PageHero'
import { getProducts } from '@/lib/getProducts'
import { getPageContent } from '@/lib/getPageContent'
import { BrandsClient } from './BrandsClient'

export const metadata: Metadata = {
  title: 'Brands',
  description: 'Shop by brand at Discount Beauty Barr. La Roche-Posay, The Ordinary, Fenty Beauty, MAC, CeraVe and more.',
}

export const dynamic = 'force-dynamic'

export default async function BrandsPage() {
  const [content, products] = await Promise.all([
    getPageContent('brands'),
    getProducts(),
  ])

  // Build brand data
  const brandMap: Record<string, { count: number; image: string; categories: string[] }> = {}
  products.forEach((p) => {
    if (!brandMap[p.brand]) {
      brandMap[p.brand] = { count: 0, image: p.images?.[0] ?? '', categories: [] }
    }
    brandMap[p.brand].count += 1
    if (!brandMap[p.brand].categories.includes(p.category)) {
      brandMap[p.brand].categories.push(p.category)
    }
    // Use first product image as brand image if we have one
    if (!brandMap[p.brand].image && p.images?.[0]) {
      brandMap[p.brand].image = p.images[0]
    }
  })

  const brands = Object.entries(brandMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const categories = [...new Set(products.map((p) => p.category))].sort()

  return (
    <>
      <PageHero
        eyebrow={content?.banner_eyebrow ?? 'Our Brands'}
        title={content?.banner_title ?? 'Shop by Brand'}
        subtitle={content?.banner_subtitle ?? 'Discover premium beauty brands curated for every skin tone and type.'}
        imageUrl={content?.banner_image_url}
      />
      <BrandsClient brands={brands} categories={categories} />
    </>
  )
}
