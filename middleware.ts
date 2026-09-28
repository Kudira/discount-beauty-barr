import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  const path = request.nextUrl.pathname

  // ── Protected APIs: /api/admin/* and /api/pos/* ───────────
  // Page routes redirect; API routes answer with JSON instead.
  if (path.startsWith('/api/admin') || path.startsWith('/api/pos')) {
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const allowed = path.startsWith('/api/admin')
      ? ['super_admin', 'admin', 'manager']
      : ['super_admin', 'admin', 'manager', 'cashier']
    if (!profile || !allowed.includes(profile.role)) {
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

  // ── Protected: /pos/* — staff, manager, admin only ────────
  if (path.startsWith('/pos')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/pos', request.url))
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

   if (!profile || !['super_admin', 'admin', 'manager', 'cashier'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }
  }

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
  matcher: [
    '/admin/:path*',
    '/pos/:path*',
    '/account/:path*',
    '/api/admin/:path*',
    '/api/pos/:path*',
  ],
}
