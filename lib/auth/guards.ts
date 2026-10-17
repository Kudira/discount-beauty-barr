import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'

export type Role = 'super_admin' | 'admin' | 'manager' | 'cashier' | 'read_only' | 'customer'

export type Caller = {
  id: string
  email: string | null
  role: Role
}

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.status = status
  }
}

/** The signed-in user and their role, or null if nobody is signed in. */
export async function getCaller(): Promise<Caller | null> {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return null
  const { data: profile } = await getServiceClient()
    .from('profiles')
    .select('email, role')
    .eq('id', user.id)
    .maybeSingle()
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    role: ((profile?.role as Role) ?? 'customer'),
  }
}

/** Throws AuthError unless the caller holds one of the roles. */
export async function requireRole(roles: Role[]): Promise<Caller> {
  const caller = await getCaller()
  if (!caller) throw new AuthError('Not signed in', 401)
  if (!roles.includes(caller.role)) throw new AuthError('You do not have permission to do this.', 403)
  return caller
}

/** Admin, manager or super admin: can change products, orders and stock. */
export const requireManager = () => requireRole(['super_admin', 'admin', 'manager'])

/** Admin or super admin: can manage people. */
export const requireAdmin = () => requireRole(['super_admin', 'admin'])

/** For route handlers: turn an AuthError into a JSON response. */
export function authErrorResponse(err: unknown) {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  return null
}
