import { createAdminClient } from '@/lib/supabase/server'
import { UsersClient } from './UsersClient'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const admin = createAdminClient()
  const { data: users } = await admin
    .from('profiles')
    .select('*')
    .in('role', ['super_admin', 'admin', 'manager', 'cashier', 'read_only'])
    .order('created_at', { ascending: false })

  return <UsersClient users={(users ?? []) as any[]} />
}
