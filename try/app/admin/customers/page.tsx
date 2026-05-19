import { createClient } from '@/lib/supabase/server'
import { CustomersClient } from './CustomersClient'

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
  const supabase = await createClient()

  const { data: customers } = await supabase
    .from('profiles')
    .select('*')
    .not('role', 'in', '(super_admin,admin,manager,cashier,read_only)')
    .order('created_at', { ascending: false })

  const { data: orderStats } = await supabase
    .from('orders')
    .select('customer_id, total')

  const statsMap = ((orderStats ?? []) as any[]).reduce((acc: any, o: any) => {
    if (!o.customer_id) return acc
    if (!acc[o.customer_id]) acc[o.customer_id] = { count: 0, total: 0 }
    acc[o.customer_id].count += 1
    acc[o.customer_id].total += o.total ?? 0
    return acc
  }, {})

  const enriched = ((customers ?? []) as any[]).map((c: any) => ({
    ...c,
    order_count: statsMap[c.id]?.count ?? 0,
    total_spent: statsMap[c.id]?.total ?? 0,
  }))

  return <CustomersClient customers={enriched} />
}
