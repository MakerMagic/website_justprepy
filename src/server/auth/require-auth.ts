import { redirect } from 'next/navigation'
import { createClient } from '../supabase/server-client'

export interface VerifiedSession {
  userId: string
  claims: Record<string, unknown>
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

    const path = parsed.pathname

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
 * Trusted server-side Supabase identity verification primitive.
 *
 * Calls `supabase.auth.getClaims()` on a request-scoped server Supabase client.
 * Returns `{ userId, claims }` when a verified JWT contains a valid non-empty `sub`.
 * Returns `null` when authentication is missing, expired, or invalid.
 * Propagates unexpected infrastructure or configuration errors (e.g. missing environment
 * variables in production) to fail closed rather than disguising them as anonymous sessions.
 *
 * Reusable by Server Components, Server Actions, and Route Handlers (which can return HTTP 401).
 */
export async function verifySession(): Promise<VerifiedSession | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    return null
  }

  const sub = data.claims.sub
  if (typeof sub !== 'string' || !sub.trim()) {
    return null
  }

  return {
    userId: sub,
    claims: data.claims,
  }
}

/**
 * Server Component page-level authentication guard.
 *
 * Calls `verifySession()`. If unauthenticated, triggers Next.js `redirect()`
 * to `/login?next=<safeAppPath>`.
 *
 * Does not swallow Next.js redirect control-flow exceptions.
 */
export async function requirePageAuth(redirectTo?: string | null): Promise<VerifiedSession> {
  const session = await verifySession()

  if (!session) {
    const safeNext = getSafeAppRedirectPath(redirectTo)
    redirect(`/login?next=${encodeURIComponent(safeNext)}`)
  }

  return session
}
