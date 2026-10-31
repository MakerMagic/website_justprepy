import { type NextRequest } from 'next/server'
import { updateSession } from './server/supabase/proxy-client'

/**
 * Next.js 16 Network Proxy for JustPrepy.
 *
 * Responsibilities:
 * 1. Passive session cookie synchronization for all public and private routes.
 * 2. Active authentication gate for protected `/app` and `/app/*` routes.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export default proxy

export const config = {
  matcher: [
    /*
     * Explicitly match all routes under the private /app application namespace,
     * ensuring private paths, nested routes, and data exports are never excluded
     * by file-extension negative lookaheads.
     */
    '/app',
    '/app/:path*',
    /*
     * Match all other request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - common static asset extensions (svg, png, jpg, jpeg, gif, webp, woff, woff2, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)$).*)',
  ],
}
