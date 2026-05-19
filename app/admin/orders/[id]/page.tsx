import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OrderDetailClient } from './OrderDetailClient'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: order } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  return <OrderDetailClient order={order as any} />
}
