import { createClient, createAdminClient } from '@/lib/supabase/server'
import { POSAuthWrapper } from './POSAuthWrapper'
import { getProducts } from '@/lib/getProducts'
import { getPosSession } from '@/lib/pos/session'

export const dynamic = 'force-dynamic'

export default async function POSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Branch of the account the till is signed in with — used when a cashier
  // has no branch assigned.
  let terminalBranch = 'osu'
  if (user) {
    const { data: profile } = await createAdminClient()
      .from('profiles')
      .select('branch_id')
      .eq('id', user.id)
      .maybeSingle()
    terminalBranch = (profile as any)?.branch_id ?? 'osu'
  }

  // If a cashier is already signed in on this till (e.g. page refresh), resume.
  // No staff list or PINs are ever sent to the browser.
  const session = await getPosSession()
  const products = await getProducts()

  return (
    <POSAuthWrapper
      products={products}
      defaultBranch={terminalBranch}
      initialCashier={session ? { name: session.name, role: session.role, branchId: session.branchId } : null}
    />
  )
}
