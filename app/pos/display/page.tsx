import { DisplayClient } from './DisplayClient'

// The customer-facing screen for the second monitor at the till. It needs
// no PIN — it only ever receives a live snapshot of the current sale from
// the cashier's screen over BroadcastChannel, never anything of its own.
export default function CustomerDisplayPage() {
  return <DisplayClient />
}
