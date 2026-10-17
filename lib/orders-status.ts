import { getServiceClient } from '@/lib/supabase/service'
import { restoreForOrder } from '@/lib/stock'

const STATUSES = ['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled', 'refunded']

/** Change an order's status. Cancelling or refunding puts its stock back. */
export async function setOrderStatus(orderId: string, status: string, by: { id: string; email: string | null; role: string }) {
  if (!STATUSES.includes(status)) throw new Error('Unknown order status.')
  const db = getServiceClient()
  const { data: before } = await db.from('orders').select('status').eq('id', orderId).maybeSingle()
  if (!before) throw new Error('Order not found.')

  const { error } = await db.from('orders').update({ status }).eq('id', orderId)
  if (error) throw new Error(error.message)

  if ((status === 'cancelled' || status === 'refunded') && before.status !== 'cancelled' && before.status !== 'refunded') {
    await restoreForOrder(orderId).catch((e) => console.error('[restock]', e))
  }

  await db.from('activity_log').insert({
    user_id: by.id, user_email: by.email, user_role: by.role,
    action: 'order.status_updated',
    entity_type: 'order',
    entity_id: orderId,
    details: { from: before.status, to: status },
  })
}
