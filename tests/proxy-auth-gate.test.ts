import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
// @ts-expect-error Next internal compiled path-to-regexp does not export standalone type definitions
import { pathToRegexp } from 'next/dist/compiled/path-to-regexp'

const mockGetClaims = vi.fn()
const mockCreateServerClient = vi.fn((_url: string, _key: string, options: unknown) => {
  return {
    auth: {
      getClaims: mockGetClaims,
    },
    _options: options,
  }
})

vi.mock('@supabase/ssr', () => ({
  createServerClient: (...args: [string, string, unknown]) => mockCreateServerClient(...args),
}))

import {
  isAppPath,
  getSafeAppRedirectPath,
  updateSession,
} from '../src/server/supabase/proxy-client'
import { config as proxyConfig } from '../src/proxy'

describe('isAppPath boundary matching', () => {
  it('correctly identifies private /app paths', () => {
    expect(isAppPath('/app')).toBe(true)
    expect(isAppPath('/app/')).toBe(true)
    expect(isAppPath('/app/question-bank/practice')).toBe(true)
    expect(isAppPath('/app/mock-tests')).toBe(true)
    expect(isAppPath('/app/mock-tests/123/take')).toBe(true)
    expect(isAppPath('/app/mock-tests/123/results')).toBe(true)
    expect(isAppPath('/app/vocabulary')).toBe(true)
    expect(isAppPath('/app/analytics')).toBe(true)
    expect(isAppPath('/app/leaderboard')).toBe(true)
    expect(isAppPath('/app/settings')).toBe(true)
  })

  it('strictly rejects paths outside /app boundary without substring collision', () => {
    expect(isAppPath('/')).toBe(false)
    expect(isAppPath('/login')).toBe(false)
    expect(isAppPath('/signup')).toBe(false)
    expect(isAppPath('/auth/callback')).toBe(false)
    expect(isAppPath('/contact')).toBe(false)
    expect(isAppPath('/subscription')).toBe(false)
    expect(isAppPath('/what-is-nuet')).toBe(false)
    expect(isAppPath('/earn')).toBe(false)
    // Critical: must not match prefixes sharing "app" like /application or /apple
    expect(isAppPath('/application')).toBe(false)
    expect(isAppPath('/application/review')).toBe(false)
    expect(isAppPath('/apple')).toBe(false)
    expect(isAppPath('/app-store')).toBe(false)
  })
})

describe('getSafeAppRedirectPath in proxy-client', () => {
  it('preserves valid canonical /app paths and safe search parameters', () => {
    expect(getSafeAppRedirectPath('/app')).toBe('/app')
    expect(getSafeAppRedirectPath('/app/')).toBe('/app')
    expect(getSafeAppRedirectPath('/app/question-bank/practice')).toBe(
      '/app/question-bank/practice'
    )
    expect(getSafeAppRedirectPath('/app/mock-tests/demo-1/take?attempt=xyz&mode=retake')).toBe(
      '/app/mock-tests/demo-1/take?attempt=xyz&mode=retake'
    )
  })

  it('rejects traversal, multiple slashes, and external URLs', () => {
    expect(getSafeAppRedirectPath('/app/../login')).toBe('/app')
    expect(getSafeAppRedirectPath('/app/%2e%2e/login')).toBe('/app')
    expect(getSafeAppRedirectPath('/app//other')).toBe('/app')
    expect(getSafeAppRedirectPath('https://evil.com/app')).toBe('/app')
    expect(getSafeAppRedirectPath('//evil.com/app')).toBe('/app')
    expect(getSafeAppRedirectPath('/\\evil.com')).toBe('/app')
    expect(getSafeAppRedirectPath('/app\\evil')).toBe('/app')
    expect(getSafeAppRedirectPath('/application')).toBe('/app')
  })
})

describe('updateSession Proxy Gate and Cookie Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_pub_test_key')
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('redirects anonymous request targeting /app to /login?next=%2Fapp', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/app')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?next=%2Fapp')
    expect(res.headers.get('cache-control')).toContain('no-store')
    expect(res.headers.get('pragma')).toBe('no-cache')
  })

  it('redirects anonymous request targeting /app/ to /login?next=%2Fapp', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/app/')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?next=%2Fapp')
  })

  it('redirects anonymous request targeting nested /app route preserving safe destination', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const req = new NextRequest(
      'http://localhost:3000/app/mock-tests/demo-4/take?attempt=att-123'
    )
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe(
      'http://localhost:3000/login?next=%2Fapp%2Fmock-tests%2Fdemo-4%2Ftake%3Fattempt%3Datt-123'
    )
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('permits valid authenticated request to /app without redirecting', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: 'usr_valid_student_123',
          email: 'student@example.com',
          role: 'authenticated',
        },
      },
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/app')
    const res = await updateSession(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
    // Private authenticated content must never be cached publicly
    expect(res.headers.get('cache-control')).toContain('no-store')
    expect(res.headers.get('pragma')).toBe('no-cache')
  })

  it('permits valid authenticated request to nested /app route', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: 'usr_valid_student_123',
          role: 'authenticated',
        },
      },
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/app/question-bank/practice')
    const res = await updateSession(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects when claims are expired or an auth error is returned', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: { message: 'Token expired' },
    })

    const req = new NextRequest('http://localhost:3000/app/vocabulary')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?next=%2Fapp%2Fvocabulary')
  })

  it('redirects when claims sub is empty or whitespace-only', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: '   ',
        },
      },
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/app/analytics')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?next=%2Fapp%2Fanalytics')
  })

  it('does NOT redirect anonymous access to /application (outside protected boundary)', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/application')
    const res = await updateSession(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('does NOT redirect anonymous access to public routes (/, /login, /signup, /contact, /auth/callback)', async () => {
    for (const publicPath of ['/', '/login', '/signup', '/contact', '/auth/callback']) {
      mockGetClaims.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const req = new NextRequest(`http://localhost:3000${publicPath}`)
      const res = await updateSession(req)

      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
    }
  })

  it('preserves refreshed cookies on redirect responses', async () => {
    // When setAll is triggered (e.g. Supabase clears invalid token or sets refreshed token)
    mockCreateServerClient.mockImplementationOnce((_url: string, _key: string, options: unknown) => {
      const opts = options as {
        cookies: {
          setAll: (cookies: Array<{ name: string; value: string; options: unknown }>) => void
        }
      }
      opts.cookies.setAll([
        {
          name: 'sb-auth-token',
          value: 'refreshed_val',
          options: { path: '/', httpOnly: true },
        },
      ])
      return {
        auth: {
          getClaims: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        },
        _options: options,
      }
    })

    const req = new NextRequest('http://localhost:3000/app/settings')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('sb-auth-token=refreshed_val')
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?next=%2Fapp%2Fsettings')
  })

  it('fails closed with HTTP 500 in production when Supabase configuration is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NODE_ENV', 'production')

    const req = new NextRequest('http://localhost:3000/app')
    const res = await updateSession(req)

    expect(res.status).toBe(500)
    expect(res.headers.get('cache-control')).toContain('no-store')
    const body = await res.text()
    expect(body).toContain('Configuration Error: Missing required Supabase environment variables')
  })

  it('denies access to protected /app in development when configuration is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')
    vi.stubEnv('NODE_ENV', 'development')

    const req = new NextRequest('http://localhost:3000/app/mock-tests')
    const res = await updateSession(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?next=%2Fapp%2Fmock-tests')
  })
})

describe('src/proxy.ts matcher coverage verification', () => {
  it('covers all required private /app paths including file extensions and nested routes', () => {
    const matchers = proxyConfig.matcher.map((pattern: string) => {
      if (pattern.startsWith('/(')) {
        // Negative lookahead regex pattern
        return new RegExp('^' + pattern + '$')
      }
      return pathToRegexp(pattern)
    })

    const doesMatch = (pathname: string) => matchers.some((re: RegExp) => re.test(pathname))

    // Private application paths:
    expect(doesMatch('/app')).toBe(true)
    expect(doesMatch('/app/')).toBe(true)
    expect(doesMatch('/app/question-bank/practice')).toBe(true)
    expect(doesMatch('/app/mock-tests')).toBe(true)
    expect(doesMatch('/app/mock-tests/demo-1/take')).toBe(true)
    expect(doesMatch('/app/mock-tests/demo-1/results')).toBe(true)
    expect(doesMatch('/app/vocabulary')).toBe(true)
    expect(doesMatch('/app/analytics')).toBe(true)
    expect(doesMatch('/app/leaderboard')).toBe(true)
    expect(doesMatch('/app/settings')).toBe(true)

    // Private paths with file extensions (must NOT be excluded by static negative lookahead)
    expect(doesMatch('/app/example.csv')).toBe(true)
    expect(doesMatch('/app/example.png')).toBe(true)
    expect(doesMatch('/app/example.zip')).toBe(true)
    expect(doesMatch('/app/reports/export.xlsx')).toBe(true)

    // Public application pages (handled by general matcher for passive session refresh):
    expect(doesMatch('/')).toBe(true)
    expect(doesMatch('/login')).toBe(true)
    expect(doesMatch('/signup')).toBe(true)
    expect(doesMatch('/auth/callback')).toBe(true)
    expect(doesMatch('/contact')).toBe(true)
    expect(doesMatch('/subscription')).toBe(true)
    expect(doesMatch('/what-is-nuet')).toBe(true)
    expect(doesMatch('/earn')).toBe(true)
    expect(doesMatch('/application')).toBe(true)

    // Static assets excluded from proxy (must be false):
    expect(doesMatch('/_next/static/chunks/main.js')).toBe(false)
    expect(doesMatch('/_next/image?url=logo.png')).toBe(false)
    expect(doesMatch('/favicon.ico')).toBe(false)
    expect(doesMatch('/icon.svg')).toBe(false)
    expect(doesMatch('/photo.jpg')).toBe(false)
  })
})
