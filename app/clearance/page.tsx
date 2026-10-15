import { notFound } from 'next/navigation'
import { getSaleState } from '@/lib/clearance'
import ClearanceShop from './ClearanceShop'

// Always rendered on request: the sale window is checked on the server every
// time, and the product list is only sent to the browser while the sale is open.
export const dynamic = 'force-dynamic'

export default async function ClearancePage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams

  let state
  try {
    state = await getSaleState(key)
  } catch (err) {
    console.error('[clearance] could not load sale', err)
    return (
      <main className="clr-wrap clr-state">
        <h2>Back in a moment</h2>
        <p>We could not load the sale just now. Refresh the page in a minute.</p>
      </main>
    )
  }
  if (!state) notFound()

  return (
    <ClearanceShop
      campaign={{ name: state.campaign.name, startsAt: state.campaign.startsAt, endsAt: state.campaign.endsAt }}
      window={state.window}
      preview={state.preview}
      items={state.items}
      serverNow={Date.now()}
    />
  )
}
