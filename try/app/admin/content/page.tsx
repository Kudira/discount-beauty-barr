import { createClient } from '@/lib/supabase/server'
import { ContentClient } from './ContentClient'

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: pages } = await supabase
    .from('page_content')
    .select('*')
    .order('page_key')

  return <ContentClient pages={(pages ?? []) as any[]} />
}
