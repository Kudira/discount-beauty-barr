import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { StatCard } from '@/components/dashboard/StatCard'
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable'
import { LowStockWidget } from '@/components/dashboard/LowStockWidget'
import {
  ShoppingBag, Users, TrendingUp, AlertTriangle,
  Package, Store
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getDashboardData() {
  const supabase = await createClient()

  // Run all queries in parallel
  const [
    ordersRes,
    customersRes,
    lowStockRes,
    recentOrdersRes,
    productCountRes,
  ] = await Promise.all([
    supabase.from('orders').select('total, status, created_at'),
    supabase.from('profiles').select('id, created_at').not('role', 'in', '(super_admin,admin,manager,cashier,read_only)'),
    supabase.from('low_stock_alerts').select('*'),
    supabase.from('orders')
      .select('id, order_number, customer_name, customer_email, status, total, fulfillment, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const orders = (ordersRes.data ?? []) as any[]
  const customers = (customersRes.data ?? []) as any[]
  const lowStock = (lowStockRes.data ?? []) as any[]
  const recentOrders = (recentOrdersRes.data ?? []) as any[]
  const productCount = productCountRes.count ?? 0

  // Revenue calculations
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  const completedOrders = orders.filter((o) => !['cancelled', 'refunded'].includes(o.status))
  const totalRevenue = completedOrders.reduce((s, o) => s + (o.total ?? 0), 0)
  const todayRevenue = completedOrders
    .filter((o) => new Date(o.created_at) >= startOfToday)
    .reduce((s, o) => s + (o.total ?? 0), 0)
  const monthRevenue = completedOrders
    .filter((o) => new Date(o.created_at) >= startOfMonth)
    .reduce((s, o) => s + (o.total ?? 0), 0)

  // Order status breakdown
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // New customers this month
  const newCustomersThisMonth = customers.filter(
    (c) => new Date(c.created_at) >= startOfMonth
  ).length

  return {
    totalRevenue,
    todayRevenue,
    monthRevenue,
    totalOrders: orders.length,
    pendingOrders: statusCounts['pending'] ?? 0,
    statusCounts,
    totalCustomers: customers.length,
    newCustomersThisMonth,
    lowStockCount: lowStock.length,
    lowStock,
    recentOrders,
    productCount,
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      sub: `${formatCurrency(data.monthRevenue)} this month`,
      icon: TrendingUp,
      accent: '#B76E79',
    },
    {
      label: 'Total Orders',
      value: data.totalOrders,
      sub: `${data.pendingOrders} pending`,
      icon: ShoppingBag,
      accent: '#7D4E57',
    },
    {
      label: 'Customers',
      value: data.totalCustomers,
      sub: `${data.newCustomersThisMonth} new this month`,
      icon: Users,
      accent: '#8C7B74',
    },
    {
      label: 'Active Products',
      value: data.productCount,
      sub: `${data.lowStockCount} low stock alerts`,
      icon: Package,
      accent: '#9A5560',
    },
  ]

  const orderStatusRows = [
    { label: 'Pending',    key: 'pending',    color: '#D97706' },
    { label: 'Confirmed',  key: 'confirmed',  color: '#2563EB' },
    { label: 'Processing', key: 'processing', color: '#7C3AED' },
    { label: 'Ready',      key: 'ready',      color: '#059669' },
    { label: 'Delivered',  key: 'delivered',  color: '#16A34A' },
    { label: 'Cancelled',  key: 'cancelled',  color: '#DC2626' },
  ]

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-8">

      {/* Page title */}
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '32px', color: '#2C2420' }}>
          Dashboard
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#8C7B74', marginTop: '2px' }}>
          {new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Today's revenue highlight */}
      <div
        className="flex items-center justify-between p-5"
        style={{ background: 'linear-gradient(135deg, #2C2420, #4A3830)', borderRadius: '6px' }}
      >
        <div>
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            Today&apos;s Revenue
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '42px', color: 'white', lineHeight: 1 }}>
            {formatCurrency(data.todayRevenue)}
          </p>
        </div>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(183,110,121,0.25)' }}
        >
          <TrendingUp size={24} color="#E8B4A0" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Middle row: recent orders + order status + low stock */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent orders — takes 2 cols */}
        <div
          className="xl:col-span-2 flex flex-col"
          style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F2EDE8' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420' }}>
              Recent Orders
            </h2>
          </div>
          <RecentOrdersTable orders={data.recentOrders as any} showViewAll />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">

          {/* Order status breakdown */}
          <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #F2EDE8' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420' }}>
                Order Status
              </h2>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              {orderStatusRows.map(({ label, key, color }) => {
                const count = data.statusCounts[key] ?? 0
                const pct = data.totalOrders > 0 ? (count / data.totalOrders) * 100 : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74' }}>
                        {label}
                      </span>
                      <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '12px', color: '#2C2420' }}>
                        {count}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: '#F2EDE8', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Low stock */}
          <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #F2EDE8' }}>
              <AlertTriangle size={16} color={data.lowStockCount > 0 ? '#D97706' : '#8C7B74'} />
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420' }}>
                Low Stock
              </h2>
              {data.lowStockCount > 0 && (
                <span style={{ marginLeft: 'auto', fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: '11px', color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '99px' }}>
                  {data.lowStockCount} alerts
                </span>
              )}
            </div>
            <div className="px-5 py-4">
              <LowStockWidget items={data.lowStock as any} />
            </div>
          </div>
        </div>
      </div>

      {/* Branch performance */}
      <div style={{ background: 'white', border: '1px solid #E8DDD4', borderRadius: '4px', overflow: 'hidden' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #F2EDE8' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '20px', color: '#2C2420' }}>
            Branch Performance
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-[#F2EDE8]">
          {[
            { id: 'osu', name: 'Osu Branch', address: 'Oxford Street' },
            { id: 'east-legon', name: 'East Legon Branch', address: 'American House Jct' },
          ].map((branch) => {
            const branchOrders = data.recentOrders.filter((o: any) => o.branch_id === branch.id)
            const branchRevenue = branchOrders.reduce((s: number, o: any) => s + (o.total ?? 0), 0)
            return (
              <div key={branch.id} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#F2EDE8' }}>
                    <Store size={15} color="#B76E79" />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '17px', color: '#2C2420' }}>
                      {branch.name}
                    </p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>
                      {branch.address}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '24px', color: '#2C2420' }}>
                      {formatCurrency(branchRevenue)}
                    </p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>Revenue</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '24px', color: '#2C2420' }}>
                      {branchOrders.length}
                    </p>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: '#8C7B74' }}>Orders</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
