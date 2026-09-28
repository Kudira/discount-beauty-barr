import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Untyped service-role client for server routes (bypasses RLS).
// Never import this from a client component.
export function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
