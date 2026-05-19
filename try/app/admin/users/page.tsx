import { createClient } from '@/lib/supabase/server'
import { UsersClient } from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['super_admin', 'admin', 'manager', 'cashier', 'read_only'])
    .order('created_at', { ascending: false })

  return <UsersClient users={(users ?? []) as any[]} />
}
