import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  accent?: string
}

export function StatCard({ label, value, sub, icon: Icon, trend, accent = '#B76E79' }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-4 p-5"
      style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px' }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}15` }}
        >
          <Icon size={18} color={accent} />
        </div>
        {trend && (
          <span
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 300,
              fontSize: '11px',
              color: trend.value >= 0 ? '#16A34A' : '#DC2626',
              background: trend.value >= 0 ? '#F0FDF4' : '#FEF2F2',
              padding: '2px 8px',
              borderRadius: '99px',
            }}
          >
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 400,
            fontSize: '32px',
            color: '#2C2420',
            lineHeight: 1,
            marginBottom: '4px',
          }}
        >
          {value}
        </p>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
          {label}
        </p>
        {sub && (
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#C4B8B2', marginTop: '2px' }}>
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
