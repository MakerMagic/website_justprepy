import { createBrowserClient } from '@supabase/ssr'

let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Creates or retrieves the singleton browser-side Supabase client.
 * Intended for use in Client Components ("use client").
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be defined in production.'
      )
    }

    console.warn(
      '[JustPrepy Identity] Supabase environment variables are missing. Please populate NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local for authentication.'
    )

    // In local development, return a placeholder instance if unconfigured to avoid breaking UI previews
    return createBrowserClient(
      supabaseUrl || 'https://placeholder-project.supabase.co',
      supabaseKey || 'sb_publishable_placeholder_key'
    )
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabaseKey)
  }

  return browserClient
}
