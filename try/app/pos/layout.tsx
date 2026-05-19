import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'POS — Discount Beauty Barr',
  description: 'Point of Sale System',
}

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden" style={{ background: '#F7F4F2', fontFamily: "'Jost', sans-serif" }}>
      {children}
    </div>
  )
}
