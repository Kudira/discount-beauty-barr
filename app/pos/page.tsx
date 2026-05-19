import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { POSAuthWrapper } from './POSAuthWrapper'
import { getProducts } from '@/lib/getProducts'

export const dynamic = 'force-dynamic'

export default async function POSPage() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  let cashierName = 'Cashier'
  let defaultBranch = 'osu'
  let userRole = 'cashier'

  if (user) {
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name, role, branch_id, pos_pin')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) {
      cashierName = (profile as any).full_name ?? 'Cashier'
      defaultBranch = (profile as any).branch_id ?? 'osu'
      userRole = (profile as any).role ?? 'cashier'
    }
  }

  // Load all POS staff (cashiers, managers, admins) for PIN login
  const { data: staff } = await admin
    .from('profiles')
    .select('id, full_name, role, branch_id, pos_pin')
    .in('role', ['super_admin', 'admin', 'manager', 'cashier'])
    .not('pos_pin', 'is', null)

  const products = await getProducts()

  return (
    <POSAuthWrapper
      products={products}
      staff={(staff ?? []) as any[]}
      currentUserName={cashierName}
      currentUserRole={userRole}
      defaultBranch={defaultBranch}
    />
  )
}
