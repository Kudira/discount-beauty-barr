import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProductEditClient } from './ProductEditClient'

export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ id: string }> }

export default async function ProductEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, product_variants(*)')
    .eq('id', id)
    .single()

  if (!product) notFound()

  return <ProductEditClient product={product as any} />
}
