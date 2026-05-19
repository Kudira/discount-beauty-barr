import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface LowStockItem {
  id: string
  product_name: string
  variant_name: string
  branch_id: string
  quantity: number
  low_stock_threshold: number
  sku: string
}

interface LowStockWidgetProps {
  items: LowStockItem[]
}

export function LowStockWidget({ items }: LowStockWidgetProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', color: '#8C7B74' }}>
          All stock levels are healthy ✓
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ borderColor: "#F2EDE8" }}>
      {items.slice(0, 6).map((item) => (
        <div key={item.id} className="flex items-center justify-between py-3 gap-3" style={{ borderBottom: "1px solid #F2EDE8" }}>
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: item.quantity === 0 ? '#FEF2F2' : '#FEF3C7' }}
            >
              <AlertTriangle
                size={13}
                color={item.quantity === 0 ? '#DC2626' : '#D97706'}
              />
            </div>
            <div className="min-w-0">
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }}
                className="truncate">
                {item.product_name}
              </p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
                {item.variant_name} · {item.branch_id === 'osu' ? 'Osu' : 'East Legon'}
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 400,
                fontSize: '18px',
                color: item.quantity === 0 ? '#DC2626' : '#D97706',
              }}
            >
              {item.quantity}
            </span>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '10px', color: '#C4B8B2' }}>
              left
            </p>
          </div>
        </div>
      ))}
      {items.length > 6 && (
        <div style={{ paddingTop: '12px', textAlign: 'center' }}>
          <Link href="/admin/inventory"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '13px', color: '#B76E79', textDecoration: 'none' }}>
            +{items.length - 6} more items →
          </Link>
        </div>
      )}
    </div>
  )
}
