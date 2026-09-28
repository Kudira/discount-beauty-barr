import { POSAuthWrapper } from './POSAuthWrapper'
import { getProducts } from '@/lib/getProducts'
import { getPosSession } from '@/lib/pos/session'

export const dynamic = 'force-dynamic'

export default async function POSPage() {
  // No staff login on this page by design — the PIN screen is the only
  // protection on the till. If a cashier is already unlocked on this
  // browser (e.g. page refresh), resume their session; no PINs or staff
  // list are ever sent to the browser either way.
  const session = await getPosSession()
  const products = await getProducts()

  return (
    <POSAuthWrapper
      products={products}
      defaultBranch="osu"
      initialCashier={session ? { name: session.name, role: session.role, branchId: session.branchId } : null}
    />
  )
}
