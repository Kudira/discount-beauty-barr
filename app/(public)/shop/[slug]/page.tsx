import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlugFromDB, getAllProductSlugs, getProducts } from '@/lib/getProducts'
import { ProductDetailClient } from './ProductDetailClient'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlugFromDB(slug)
  if (!product) return { title: 'Product Not Found' }
  return {
    title: `${product.name} — ${product.brand}`,
    description: product.description,
    openGraph: {
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const [product, allProducts] = await Promise.all([
    getProductBySlugFromDB(slug),
    getProducts(),
  ])
  if (!product) notFound()

  // Related: same category, exclude current product
  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4)

  return <ProductDetailClient product={product} related={related} />
}
