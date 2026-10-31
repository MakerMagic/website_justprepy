import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a request-scoped Supabase client for Server Components, Server Actions,
 * and Route Handlers.
 *
 * Request isolation is mandatory: a new instance is instantiated per request context
 * and is never shared across requests.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be defined in production.'
      )
    }

    console.warn(
      '[JustPrepy Server] Supabase environment variables are missing. Please populate NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.'
    )
  }

  return createServerClient(
    supabaseUrl || 'https://placeholder-project.supabase.co',
    supabaseKey || 'sb_publishable_placeholder_key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This is expected and safe to ignore when session cookies are refreshed via proxy.ts.
          }
        },
      },
    }
  )
}
