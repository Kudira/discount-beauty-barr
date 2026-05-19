import { createAdminClient } from '@/lib/supabase/server'
import { ReportsClient } from './ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = createAdminClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
  const startOf30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: allOrders },
    { data: monthOrders },
    { data: lastMonthOrders },
    { data: topProducts },
    { data: payments },
  ] = await Promise.all([
    supabase.from('orders').select('id, total, status, branch_id, created_at, source').neq('status', 'cancelled'),
    supabase.from('orders').select('id, total, status, branch_id, created_at').gte('created_at', startOfMonth).neq('status', 'cancelled'),
    supabase.from('orders').select('id, total').gte('created_at', startOfLastMonth).lte('created_at', endOfLastMonth).neq('status', 'cancelled'),
    supabase.from('order_items').select('product_name, brand, quantity, price').gte('order_id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('payments').select('method, amount, status').eq('status', 'success').gte('created_at', startOf30Days),
  ])

  return (
    <ReportsClient
      allOrders={(allOrders ?? []) as any[]}
      monthOrders={(monthOrders ?? []) as any[]}
      lastMonthOrders={(lastMonthOrders ?? []) as any[]}
      topProducts={(topProducts ?? []) as any[]}
      payments={(payments ?? []) as any[]}
    />
  )
}
