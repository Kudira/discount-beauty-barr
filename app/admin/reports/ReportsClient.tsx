'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, ShoppingBag, Store, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', card: 'Card', mobile_money: 'Mobile Money',
  momo_mtn: 'MTN MoMo', momo_vodafone: 'Vodafone Cash', momo_airteltigo: 'AirtelTigo',
}

interface Props {
  allOrders: any[]
  monthOrders: any[]
  lastMonthOrders: any[]
  topProducts: any[]
  payments: any[]
}

export function ReportsClient({ allOrders, monthOrders, lastMonthOrders, topProducts, payments }: Props) {
  const monthRevenue = monthOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const lastMonthRevenue = lastMonthOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const revChange = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0
  const totalRevenue = allOrders.reduce((s, o) => s + (o.total ?? 0), 0)

  // Daily revenue — last 30 days
  const dailyRevenue = useMemo(() => {
    const map: Record<string, number> = {}
    allOrders.forEach((o) => {
      const day = o.created_at?.slice(0, 10)
      if (day) map[day] = (map[day] ?? 0) + (o.total ?? 0)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-30)
  }, [allOrders])

  // Branch breakdown
  const branchRevenue = useMemo(() => {
    const osu = allOrders.filter((o) => o.branch_id === 'osu').reduce((s, o) => s + (o.total ?? 0), 0)
    const el = allOrders.filter((o) => o.branch_id === 'east-legon').reduce((s, o) => s + (o.total ?? 0), 0)
    const online = allOrders.filter((o) => o.source === 'online' || !o.branch_id).reduce((s, o) => s + (o.total ?? 0), 0)
    return [
      { label: 'Osu Branch', value: osu, color: '#B76E79' },
      { label: 'East Legon', value: el, color: '#7D4E57' },
      { label: 'Online', value: online, color: '#9A5560' },
    ]
  }, [allOrders])

  // Top products
  const topProductsAgg = useMemo(() => {
    const map: Record<string, { name: string; brand: string; qty: number; revenue: number }> = {}
    topProducts.forEach((item) => {
      const key = item.product_name
      if (!map[key]) map[key] = { name: item.product_name, brand: item.brand, qty: 0, revenue: 0 }
      map[key].qty += item.quantity
      map[key].revenue += item.price * item.quantity
    })
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  }, [topProducts])

  // Payment methods
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    payments.forEach((p) => { map[p.method] = (map[p.method] ?? 0) + (p.amount ?? 0) })
    return Object.entries(map).sort(([, a], [, b]) => b - a)
  }, [payments])

  const maxDaily = Math.max(...dailyRevenue.map(([, v]) => v), 1)
  const maxBranch = Math.max(...branchRevenue.map((b) => b.value), 1)

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>Reports</h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74' }}>
          Business overview and performance metrics
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: 'All time', icon: TrendingUp },
          { label: 'This Month', value: formatCurrency(monthRevenue), sub: `${revChange >= 0 ? '+' : ''}${revChange.toFixed(1)}% vs last month`, icon: revChange >= 0 ? TrendingUp : TrendingDown, subColor: revChange >= 0 ? '#16A34A' : '#DC2626' },
          { label: 'Total Orders', value: allOrders.length, sub: `${monthOrders.length} this month`, icon: ShoppingBag },
          { label: 'Avg Order Value', value: formatCurrency(allOrders.length > 0 ? totalRevenue / allOrders.length : 0), sub: 'Per order', icon: CreditCard },
        ].map((card) => (
          <div key={card.label} className="p-5" style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px' }}>
            <div className="flex items-start justify-between mb-3">
              <card.icon size={18} color="#B76E79" />
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '30px', color: '#2C2420', lineHeight: 1 }}>
              {card.value}
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', marginTop: '4px' }}>{card.label}</p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: (card as any).subColor ?? '#C4B8B2', marginTop: '2px' }}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Daily revenue chart */}
        <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420', marginBottom: '16px' }}>
            Daily Revenue (Last 30 Days)
          </h2>
          {dailyRevenue.length === 0 ? (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', color: '#8C7B74', textAlign: 'center', padding: '32px 0' }}>No data yet</p>
          ) : (
            <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', gap: '3px', overflow: 'hidden' }}>
              {dailyRevenue.map(([day, val]) => (
                <div key={day} title={`${day}: ${formatCurrency(val)}`}
                  style={{ flex: 1, minWidth: '4px', background: '#B76E79', borderRadius: '2px 2px 0 0', height: `${(val / maxDaily) * 100}%`, opacity: 0.8, transition: 'height 0.3s', cursor: 'pointer' }} />
              ))}
            </div>
          )}
          <div className="flex justify-between mt-2">
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: '#C4B8B2' }}>{dailyRevenue[0]?.[0] ?? ''}</span>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: '#C4B8B2' }}>{dailyRevenue[dailyRevenue.length - 1]?.[0] ?? ''}</span>
          </div>
        </div>

        {/* Branch breakdown */}
        <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420', marginBottom: '16px' }}>
            Revenue by Channel
          </h2>
          <div className="flex flex-col gap-4">
            {branchRevenue.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between mb-1">
                  <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Store size={12} color={b.color} /> {b.label}
                  </span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', color: '#2C2420' }}>{formatCurrency(b.value)}</span>
                </div>
                <div style={{ height: '8px', background: '#F2EDE8', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(b.value / maxBranch) * 100}%`, background: b.color, borderRadius: '4px', transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420', marginBottom: '16px' }}>
            Top Products
          </h2>
          {topProductsAgg.length === 0 ? (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', color: '#8C7B74', textAlign: 'center', padding: '32px 0' }}>No sales data yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topProductsAgg.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', color: '#D4C5B8', fontWeight: 400, width: '20px', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '13px', color: '#2C2420' }} className="truncate">{p.name}</p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>{p.brand} · {p.qty} sold</p>
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', color: '#2C2420', flexShrink: 0 }}>
                    {formatCurrency(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', padding: '20px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420', marginBottom: '16px' }}>
            Payment Methods (Last 30 Days)
          </h2>
          {paymentBreakdown.length === 0 ? (
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', color: '#8C7B74', textAlign: 'center', padding: '32px 0' }}>No payment data yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {paymentBreakdown.map(([method, amount]) => {
                const total = paymentBreakdown.reduce((s, [, v]) => s + v, 0)
                const pct = total > 0 ? (amount / total) * 100 : 0
                return (
                  <div key={method}>
                    <div className="flex justify-between mb-1">
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420' }}>
                        <CreditCard size={12} className="inline mr-1.5" style={{ color: '#B76E79' }} />
                        {METHOD_LABELS[method] ?? method}
                      </span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>{pct.toFixed(0)}%</span>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', color: '#2C2420' }}>{formatCurrency(amount)}</span>
                      </div>
                    </div>
                    <div style={{ height: '6px', background: '#F2EDE8', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#B76E79', borderRadius: '3px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
