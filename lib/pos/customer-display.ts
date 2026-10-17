// Shared contract between the cashier's POS screen (app/pos/POSClient.tsx)
// and the customer-facing second-monitor screen (app/pos/display). The two
// windows talk over a same-origin BroadcastChannel — no server round-trip,
// so the customer display updates instantly as the cashier works.

export const DISPLAY_CHANNEL = 'dbb-pos-customer-display'

export interface DisplayItem {
  name: string
  variantName: string
  price: number
  quantity: number
}

export interface DisplayState {
  type: 'state'
  stage: 'shopping' | 'confirm' | 'paid' | 'idle'
  branchId: string
  items: DisplayItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod?: 'cash' | 'card' | 'momo'
  cashPaid?: number
  change?: number
}

// Sent by the display screen when it (re)opens, so the till can immediately
// push its current state instead of leaving the display blank until the
// next cart change.
export interface DisplayHello {
  type: 'hello'
}

export type DisplayMessage = DisplayState | DisplayHello
