import { createClient } from './identity-client'

/**
 * Initiates Google OAuth sign-in via Supabase Auth using the PKCE flow.
 *
 * @param redirectTo Optional internal relative destination (defaults to '/practice')
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = createClient()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const callbackUrl = new URL('/auth/callback', origin)

  if (
    redirectTo &&
    redirectTo.startsWith('/') &&
    !redirectTo.startsWith('//') &&
    !redirectTo.startsWith('/\\')
  ) {
    callbackUrl.searchParams.set('next', redirectTo)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    throw error
  }

  return data
}
