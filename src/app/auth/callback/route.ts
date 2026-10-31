import { createClient } from '../../../server/supabase/server-client'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Validates that a requested redirect path is safe and strictly internal.
 * Rejects external URLs, protocol-relative URLs (// or /\), and malformed strings.
 * Defaults strictly to `/app`.
 */
export function getSafeRedirectUrl(nextParam: string | null, requestUrl: string): URL {
  const base = new URL(requestUrl)
  const defaultUrl = new URL('/app', base.origin)

  if (!nextParam || typeof nextParam !== 'string') {
    return defaultUrl
  }

  // Must begin with a single slash and not start with // or /\
  if (
    nextParam.startsWith('/') &&
    !nextParam.startsWith('//') &&
    !nextParam.startsWith('/\\') &&
    !nextParam.includes('\\') &&
    !/[\x00-\x1f\x7f]/.test(nextParam)
  ) {
    try {
      const parsed = new URL(nextParam, base.origin)
      if (parsed.origin === base.origin) {
        return parsed
      }
    } catch {
      // Invalid URL format fallback
    }
  }

  return defaultUrl
}

/**
 * Route Handler for Supabase OAuth callbacks with PKCE code exchange.
 *
 * Scope: Task B (Google Sign-In session verification).
 * Does NOT perform profile provisioning or database lookups (belongs to Task D).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url)
  const searchParams = requestUrl.searchParams

  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const nextParam = searchParams.get('next')

  const origin = requestUrl.origin

  // 1. Handle OAuth provider errors or user cancellation
  if (error) {
    console.warn(
      `[JustPrepy Auth Callback] OAuth error received: ${error} - ${errorDescription || 'no description'}`
    )
    const failureUrl = new URL('/login', origin)
    failureUrl.searchParams.set(
      'error',
      error === 'access_denied' ? 'oauth_cancelled' : 'oauth_error'
    )
    const response = NextResponse.redirect(failureUrl)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    return response
  }

  // 2. Handle missing code parameter
  if (!code) {
    console.warn('[JustPrepy Auth Callback] Missing authorization code parameter.')
    const failureUrl = new URL('/login', origin)
    failureUrl.searchParams.set('error', 'missing_code')
    const response = NextResponse.redirect(failureUrl)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    return response
  }

  // 3. Exchange PKCE code for session using request-scoped server Supabase client
  try {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error(
        `[JustPrepy Auth Callback] Code exchange failed: ${exchangeError.message}`
      )
      const failureUrl = new URL('/login', origin)
      failureUrl.searchParams.set('error', 'auth_exchange_failed')
      const response = NextResponse.redirect(failureUrl)
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      return response
    }
  } catch (err) {
    console.error('[JustPrepy Auth Callback] Unexpected error during code exchange:', err)
    const failureUrl = new URL('/login', origin)
    failureUrl.searchParams.set('error', 'auth_exchange_failed')
    const response = NextResponse.redirect(failureUrl)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    return response
  }

  // 4. Successful session established: redirect to safe internal destination (defaults to /app)
  const destinationUrl = getSafeRedirectUrl(nextParam, request.url)
  const successResponse = NextResponse.redirect(destinationUrl)

  // Prevent shared caching of responses establishing authenticated sessions
  successResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  successResponse.headers.set('Pragma', 'no-cache')

  return successResponse
}
