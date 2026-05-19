import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#F2EDE8' }}>
        <ShoppingBag className="w-9 h-9" style={{ color: '#D4C5B8' }} />
      </div>
      <div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '28px', color: '#2C2420', marginBottom: '8px' }}>
          Your Cart is Empty
        </h3>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#8C7B74', lineHeight: 1.7, maxWidth: '280px', margin: '0 auto' }}>
          Looks like you haven&apos;t added anything yet. Discover our collection and treat yourself.
        </p>
      </div>
      <Link href="/shop"
        style={{ marginTop: '8px', padding: '13px 36px', background: '#2C2420', color: 'white', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', letterSpacing: '0.06em', textDecoration: 'none', borderRadius: '2px' }}
        className="hover:bg-[#B76E79] transition-colors">
        Shop Now
      </Link>
    </div>
  )
}
