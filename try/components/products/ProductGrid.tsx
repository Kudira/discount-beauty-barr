import { ProductCard } from '@/components/shared/ProductCard'
import type { Product } from '@/types'
import { ShoppingBag } from 'lucide-react'

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: '#F2EDE8' }}
        >
          <ShoppingBag className="w-7 h-7" style={{ color: '#D4C5B8' }} />
        </div>
        <h3
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 400,
            fontSize: '24px',
            color: '#2C2420',
          }}
        >
          No products found
        </h3>
        <p
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 300,
            fontSize: '14px',
            color: '#8C7B74',
          }}
        >
          Try adjusting your filters or search term.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
