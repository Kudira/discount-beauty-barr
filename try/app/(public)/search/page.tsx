import { Suspense } from 'react'
import { getProducts } from '@/lib/getProducts'
import { SearchClient } from './SearchClient'

export const dynamic = 'force-dynamic'

export default async function SearchPage() {
  const products = await getProducts()
  return (
    <Suspense fallback={<div className="py-24 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>Searching…</div>}>
      <SearchClient products={products} />
    </Suspense>
  )
}
