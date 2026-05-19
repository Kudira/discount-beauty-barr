import { createClient } from '@/lib/supabase/server'
import { OrdersClient } from './OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, status, total, fulfillment, branch_id, created_at')
    .order('created_at', { ascending: false })

  return <OrdersClient orders={(data ?? []) as any[]} />
}
