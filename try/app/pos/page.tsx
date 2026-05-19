import { createClient } from '@/lib/supabase/server'
import { POSClient } from './POSClient'
import { getProducts } from '@/lib/getProducts'

export const dynamic = 'force-dynamic'

export default async function POSPage() {
  const supabase = await createClient()

  const [products, { data: { user } }] = await Promise.all([
    getProducts(),
    supabase.auth.getUser(),
  ])

  // Safely fetch profile — don't crash if missing
  let cashierName = 'Cashier'
  let branchId = 'osu'

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, branch_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) {
      cashierName = (profile as any).full_name ?? 'Cashier'
      branchId = (profile as any).branch_id ?? 'osu'
    }
  }

  return (
    <POSClient
      products={products}
      cashierName={cashierName}
      branchId={branchId}
    />
  )
}
