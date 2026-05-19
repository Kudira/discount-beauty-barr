import { createAdminClient } from '@/lib/supabase/server'
import { CustomersClient } from './CustomersClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminCustomersPage() {
  const admin = createAdminClient()

  const [{ data: profiles }, { data: orders }] = await Promise.all([
    admin.from('profiles')
      .select('id, full_name, email, phone, created_at, role')
      .not('role', 'in', '(super_admin,admin,manager,cashier,read_only)')
      .order('created_at', { ascending: false }),
    admin.from('orders')
      .select('id, customer_id, customer_name, customer_email, total, status, created_at'),
  ])

  const allOrders = (orders ?? []) as any[]
  const allProfiles = (profiles ?? []) as any[]

  // Stats per registered customer
  const statsMap: Record<string, { count: number; total: number; lastOrder: string }> = {}
  allOrders.forEach((o: any) => {
    if (!o.customer_id) return
    if (!statsMap[o.customer_id]) statsMap[o.customer_id] = { count: 0, total: 0, lastOrder: o.created_at }
    statsMap[o.customer_id].count++
    statsMap[o.customer_id].total += o.total ?? 0
  })

  // Registered customers
  const registered = allProfiles.map((c: any) => ({
    id: c.id,
    name: c.full_name || 'No name set',
    email: c.email,
    phone: c.phone,
    type: 'registered' as const,
    order_count: statsMap[c.id]?.count ?? 0,
    total_spent: statsMap[c.id]?.total ?? 0,
    joined: c.created_at,
  }))

  // Guest customers (orders with no customer_id, grouped by email)
  const guestMap: Record<string, any> = {}
  allOrders.filter((o: any) => !o.customer_id && o.customer_email).forEach((o: any) => {
    const email = o.customer_email
    if (!guestMap[email]) {
      guestMap[email] = {
        id: `guest-${email}`,
        name: o.customer_name || 'Guest',
        email,
        phone: null,
        type: 'guest' as const,
        order_count: 0,
        total_spent: 0,
        joined: o.created_at,
      }
    }
    guestMap[email].order_count++
    guestMap[email].total_spent += o.total ?? 0
  })

  const all = [...registered, ...Object.values(guestMap)]
    .sort((a, b) => new Date(b.joined).getTime() - new Date(a.joined).getTime())

  return <CustomersClient customers={all} />
}
