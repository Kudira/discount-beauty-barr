import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ── Optional sale lockdown ────────────────────────────────────────────────
// While SALE_LOCKDOWN_UNTIL is set to a future ISO date (e.g. 2026-10-20T00:00:00Z),
// every public store page redirects to /clearance, so the clearance link never
// leads into the unfinished shop. Staff areas, login, the POS and all APIs stay
// reachable. Remove the variable in Vercel (and redeploy) to switch it off.
const LOCKDOWN_ALLOWED = ['/clearance', '/api', '/admin', '/pos', '/login', '/register', '/forgot-password', '/auth', '/account']

function lockedOut(path: string): boolean {
  const until = process.env.SALE_LOCKDOWN_UNTIL
  if (!until) return false
  const t = new Date(until).getTime()
  if (Number.isNaN(t) || Date.now() >= t) return false
  return !LOCKDOWN_ALLOWED.some((p) => path === p || path.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (lockedOut(path)) {
    return NextResponse.redirect(new URL('/clearance', request.url))
  }

  // Only the protected areas below need a session check.
  if (!path.startsWith('/admin') && !path.startsWith('/account') && !path.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // ── Protected APIs: /api/admin/* — admin/manager login required ──
  // /api/pos/* is NOT gated here: the POS PIN (checked inside those routes)
  // is the only protection on the till, by design — no staff login needed
  // to open the POS page or its APIs on the in-store terminal.
  if (path.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || !['super_admin', 'admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }
    return supabaseResponse
  }

  // ── Protected: /admin/* — admin and manager only ──────────
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/admin', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['super_admin', 'admin', 'manager'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }
  }

  // /pos is intentionally NOT gated by staff login — see note above.
  // The PIN keypad on that page is the only thing protecting the till.

  // ── Protected: /account/* — logged in customers ───────────
  if (path.startsWith('/account')) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?redirect=${path}`, request.url))
    }
  }

  // ── Auth pages: allow access even when logged in (user may want to switch) ──
  // No redirect — users can visit /login while logged in to sign out first

  return supabaseResponse
}

export const config = {
  // Everything except static files, so the sale lockdown can see public pages.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|txt|xml)$).*)'],
}
