import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Checks whether a request pathname falls strictly within the private `/app` application namespace.
 *
 * Matches:
 * - `/app`
 * - `/app/`
 * - `/app/...` (e.g. `/app/mock-tests`, `/app/question-bank/practice`)
 *
 * Rejects (returns false):
 * - `/`
 * - `/login`, `/signup`, `/auth/callback`
 * - `/contact`, `/subscription`, `/what-is-nuet`, `/earn`
 * - `/application`, `/apple` (strictly respects the `/app` boundary)
 */
export function isAppPath(pathname: string): boolean {
  if (typeof pathname !== 'string') {
    return false
  }
  return pathname === '/app' || pathname.startsWith('/app/')
}

/**
 * Validates that an optional redirect destination is strictly within the private
 * `/app` application namespace.
 *
 * Uses URL parsing and path canonicalization to defend against:
 * - Path traversal (`..`, `.`, `%2e%2e`, `%2e`)
 * - Multiple consecutive slashes (`//`)
 * - Backslashes (`\`)
 * - Control characters
 * - Protocol-relative or external host redirects
 * - Paths outside `/app` (e.g. `/`, `/login`, `/contact`, `/application`, `/practice`)
 *
 * Preserves safe query parameters (e.g. `?attempt=demo-1`).
 * Falls back strictly to `/app` on any unsafe, ambiguous, or non-`/app` input.
 */
export function getSafeAppRedirectPath(target?: string | null): string {
  if (!target || typeof target !== 'string') {
    return '/app'
  }

  // Must begin with a single slash and not start with // or /\
  if (!target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return '/app'
  }

  // Reject any backslashes or ASCII control characters anywhere in the target string
  if (target.includes('\\') || /[\x00-\x1f\x7f]/.test(target)) {
    return '/app'
  }

  try {
    const base = 'http://localhost'
    const parsed = new URL(target, base)

    // Ensure origin was not altered
    if (parsed.origin !== base) {
      return '/app'
    }

    let path = parsed.pathname

    // Canonicalize `/app/` to `/app`
    if (path === '/app/') {
      path = '/app'
    }

    // Canonical path must be exactly `/app` or start with `/app/`
    if (path !== '/app' && !path.startsWith('/app/')) {
      return '/app'
    }

    // Reject consecutive slashes in canonical path (e.g. `/app//other`)
    if (path.includes('//')) {
      return '/app'
    }

    // Verify search string does not contain control characters
    if (/[\x00-\x1f\x7f]/.test(parsed.search)) {
      return '/app'
    }

    return path + parsed.search
  } catch {
    return '/app'
  }
}

/**
 * Request-scoped session refresh and authentication gate for the Next.js 16 Network Proxy.
 *
 * Responsibilities:
 * 1. Synchronizes cookies and refreshes expired sessions via `supabase.auth.getClaims()`.
 * 2. Enforces access control for `/app` and `/app/*`:
 *    - Valid authenticated session $\rightarrow$ permits passage.
 *    - Missing, expired, or invalid session $\rightarrow$ redirects to `/login?next=<safeAppPath>`
 *      while preserving refreshed/cleared cookies and anti-caching headers.
 * 3. Preserves public routes (`/`, `/login`, `/signup`, `/contact`, etc.) without auth barriers.
 * 4. Fails closed (HTTP 500 in production, or redirect to login in development) if required
 *    Supabase configuration is missing.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname
  const isProtected = isAppPath(pathname)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(
        'Configuration Error: Missing required Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).',
        {
          status: 500,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            Pragma: 'no-cache',
          },
        }
      )
    }

    // In development without configuration:
    if (isProtected) {
      console.warn(
        '[JustPrepy Proxy] Missing Supabase configuration in development. Denying access to protected /app route.'
      )
      const safeNext = getSafeAppRedirectPath(pathname + request.nextUrl.search)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', safeNext)

      const redirectResponse = NextResponse.redirect(loginUrl)
      redirectResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      redirectResponse.headers.set('Pragma', 'no-cache')
      return redirectResponse
    }

    return supabaseResponse
  }

  let cookiesRefreshed = false

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesRefreshed = true

        // Propagate refreshed cookies to the request so downstream Server Components receive them
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

        // Re-create the response to update request headers
        supabaseResponse = NextResponse.next({
          request,
        })

        // Propagate cookies with all options to the outgoing response for the client browser
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // Verify JWT claims and refresh session token
  let claimsResult: Record<string, unknown> | null = null
  let claimsError: unknown = null

  try {
    const { data, error } = await supabase.auth.getClaims()
    claimsResult = (data?.claims as Record<string, unknown>) ?? null
    claimsError = error
  } catch (err) {
    claimsError = err
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[JustPrepy Proxy] Session validation error:', err)
    }
  }

  // Enforce authentication gate for protected `/app` routes
  if (isProtected) {
    const isValidSession =
      !claimsError &&
      claimsResult !== null &&
      typeof claimsResult.sub === 'string' &&
      claimsResult.sub.trim().length > 0

    if (!isValidSession) {
      const safeNext = getSafeAppRedirectPath(pathname + request.nextUrl.search)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', safeNext)

      const redirectResponse = NextResponse.redirect(loginUrl)

      // Preserve all cookies from supabaseResponse (e.g. cleared expired tokens or refreshed cookies)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })

      redirectResponse.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, private'
      )
      redirectResponse.headers.set('Pragma', 'no-cache')
      return redirectResponse
    }

    // Authenticated user accessing /app: apply anti-caching headers so private content is not cached publicly
    supabaseResponse.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    )
    supabaseResponse.headers.set('Pragma', 'no-cache')
    return supabaseResponse
  }

  // Public routes: prevent caching only if cookies were actively refreshed
  if (cookiesRefreshed) {
    supabaseResponse.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    )
    supabaseResponse.headers.set('Pragma', 'no-cache')
  }

  return supabaseResponse
}
