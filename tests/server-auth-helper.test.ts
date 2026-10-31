import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockGetClaims = vi.fn()
const mockCreateClient = vi.fn(() => ({
  auth: {
    getClaims: mockGetClaims,
  },
}))

vi.mock('../src/server/supabase/server-client', () => ({
  createClient: () => mockCreateClient(),
}))

const mockRedirect = vi.fn((url: string) => {
  const error = new Error(`NEXT_REDIRECT:${url}`)
  // Simulate Next.js redirect internal digest / error structure
  ;(error as unknown as { digest: string }).digest = `NEXT_REDIRECT;replace;${url};307;;`
  throw error
})

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

import {
  getSafeAppRedirectPath,
  verifySession,
  requirePageAuth,
} from '../src/server/auth/require-auth'

describe('getSafeAppRedirectPath', () => {
  it('accepts exact /app', () => {
    expect(getSafeAppRedirectPath('/app')).toBe('/app')
  })

  it('accepts valid nested paths and preserves safe query parameters', () => {
    expect(getSafeAppRedirectPath('/app/question-bank/practice')).toBe(
      '/app/question-bank/practice'
    )
    expect(getSafeAppRedirectPath('/app/mock-tests')).toBe('/app/mock-tests')
    expect(getSafeAppRedirectPath('/app/mock-tests/test-1/take?attempt=demo-1&mode=retake')).toBe(
      '/app/mock-tests/test-1/take?attempt=demo-1&mode=retake'
    )
    expect(getSafeAppRedirectPath('/app/vocabulary')).toBe('/app/vocabulary')
    expect(getSafeAppRedirectPath('/app/analytics')).toBe('/app/analytics')
    expect(getSafeAppRedirectPath('/app/leaderboard')).toBe('/app/leaderboard')
    expect(getSafeAppRedirectPath('/app/settings')).toBe('/app/settings')
  })

  it('rejects dot segment traversal attacks and falls back to /app', () => {
    expect(getSafeAppRedirectPath('/app/../login')).toBe('/app')
    expect(getSafeAppRedirectPath('/app/%2e%2e/login')).toBe('/app')
    expect(getSafeAppRedirectPath('/app/../../outside')).toBe('/app')
    expect(getSafeAppRedirectPath('/app/mock-tests/../../evil')).toBe('/app')
  })

  it('rejects multiple consecutive slashes and falls back to /app', () => {
    expect(getSafeAppRedirectPath('/app//other-path')).toBe('/app')
    expect(getSafeAppRedirectPath('/app/mock-tests//extra')).toBe('/app')
    expect(getSafeAppRedirectPath('//evil.com/app')).toBe('/app')
    expect(getSafeAppRedirectPath('/app///nested')).toBe('/app')
  })

  it('rejects backslashes and encoded backslash tricks and falls back to /app', () => {
    expect(getSafeAppRedirectPath('/app\\nested')).toBe('/app')
    expect(getSafeAppRedirectPath('/app/\\evil')).toBe('/app')
    expect(getSafeAppRedirectPath('/\\evil.com')).toBe('/app')
    expect(getSafeAppRedirectPath('\\app')).toBe('/app')
  })

  it('rejects control characters and falls back to /app', () => {
    expect(getSafeAppRedirectPath('/app\x00evil')).toBe('/app')
    expect(getSafeAppRedirectPath('/app\x07bell')).toBe('/app')
    expect(getSafeAppRedirectPath('/app?q=\x01bad')).toBe('/app')
  })

  it('rejects paths outside /app and falls back to /app', () => {
    expect(getSafeAppRedirectPath('/')).toBe('/app')
    expect(getSafeAppRedirectPath('/login')).toBe('/app')
    expect(getSafeAppRedirectPath('/contact')).toBe('/app')
    expect(getSafeAppRedirectPath('/subscription')).toBe('/app')
    expect(getSafeAppRedirectPath('/practice')).toBe('/app')
    expect(getSafeAppRedirectPath('/application')).toBe('/app')
    expect(getSafeAppRedirectPath('/apple')).toBe('/app')
  })

  it('rejects external URLs and falls back to /app', () => {
    expect(getSafeAppRedirectPath('https://malicious.example.com/app')).toBe('/app')
    expect(getSafeAppRedirectPath('http://malicious.example.com/app')).toBe('/app')
    expect(getSafeAppRedirectPath('ftp://example.com/app')).toBe('/app')
    expect(getSafeAppRedirectPath('javascript:alert(1)')).toBe('/app')
  })

  it('handles null, undefined, empty, and non-string inputs safely', () => {
    expect(getSafeAppRedirectPath(null)).toBe('/app')
    expect(getSafeAppRedirectPath(undefined)).toBe('/app')
    expect(getSafeAppRedirectPath('')).toBe('/app')
    expect(getSafeAppRedirectPath('   ')).toBe('/app')
  })
})

describe('verifySession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns verified userId and claims when valid JWT claims contain a sub', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: 'usr_abc_123',
          email: 'student@example.com',
          role: 'authenticated',
        },
      },
      error: null,
    })

    const result = await verifySession()
    expect(result).toEqual({
      userId: 'usr_abc_123',
      claims: {
        sub: 'usr_abc_123',
        email: 'student@example.com',
        role: 'authenticated',
      },
    })
  })

  it('returns null when getClaims returns missing data or null claims (expected unauthenticated)', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    const result = await verifySession()
    expect(result).toBeNull()
  })

  it('returns null when getClaims returns an auth error (expected invalid/expired token)', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: { message: 'JWT expired' },
    })

    const result = await verifySession()
    expect(result).toBeNull()
  })

  it('returns null when claims object has an empty or whitespace-only sub', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: '   ',
          email: 'student@example.com',
        },
      },
      error: null,
    })

    const result = await verifySession()
    expect(result).toBeNull()
  })

  it('returns null when sub claim is not a string or missing', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: 12345,
        },
      },
      error: null,
    })
    expect(await verifySession()).toBeNull()

    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          email: 'student@example.com',
        },
      },
      error: null,
    })
    expect(await verifySession()).toBeNull()
  })

  it('propagates unexpected infrastructure errors from createClient() rather than disguising them as null', async () => {
    mockCreateClient.mockImplementationOnce(() => {
      throw new Error(
        'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be defined in production.'
      )
    })

    await expect(verifySession()).rejects.toThrow(
      'Missing required Supabase environment variables'
    )
  })

  it('propagates unexpected runtime errors from getClaims() rather than disguising them as null', async () => {
    mockGetClaims.mockRejectedValueOnce(
      new TypeError('Database connection pool exhausted or crypto API failure')
    )

    await expect(verifySession()).rejects.toThrow(
      'Database connection pool exhausted or crypto API failure'
    )
  })
})

describe('requirePageAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns verified session and does not redirect when authenticated', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: 'usr_valid_student',
          role: 'authenticated',
        },
      },
      error: null,
    })

    const session = await requirePageAuth('/app/question-bank/practice')
    expect(session).toEqual({
      userId: 'usr_valid_student',
      claims: {
        sub: 'usr_valid_student',
        role: 'authenticated',
      },
    })
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('redirects to /login?next=%2Fapp by default when unauthenticated', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(requirePageAuth()).rejects.toThrow('NEXT_REDIRECT:/login?next=%2Fapp')
    expect(mockRedirect).toHaveBeenCalledWith('/login?next=%2Fapp')
  })

  it('redirects to /login with encoded safe /app path when unauthenticated', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(
      requirePageAuth('/app/question-bank/practice')
    ).rejects.toThrow('NEXT_REDIRECT:/login?next=%2Fapp%2Fquestion-bank%2Fpractice')
    expect(mockRedirect).toHaveBeenCalledWith(
      '/login?next=%2Fapp%2Fquestion-bank%2Fpractice'
    )
  })

  it('sanitizes traversal attempts and falls back to /app in redirect parameter', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(
      requirePageAuth('/app/../login')
    ).rejects.toThrow('NEXT_REDIRECT:/login?next=%2Fapp')
    expect(mockRedirect).toHaveBeenCalledWith('/login?next=%2Fapp')
  })

  it('falls back to /app when an unsafe external destination is provided to unauthenticated user', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    await expect(
      requirePageAuth('https://malicious.example.com/steal-creds')
    ).rejects.toThrow('NEXT_REDIRECT:/login?next=%2Fapp')
    expect(mockRedirect).toHaveBeenCalledWith('/login?next=%2Fapp')
  })

  it('propagates unexpected infrastructure errors without calling redirect', async () => {
    mockCreateClient.mockImplementationOnce(() => {
      throw new Error('Database connection failed')
    })

    await expect(requirePageAuth('/app/mock-tests')).rejects.toThrow('Database connection failed')
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('does not swallow Next.js redirect control-flow error', async () => {
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: null,
    })

    let caughtError: unknown
    try {
      await requirePageAuth('/app/mock-tests')
    } catch (err) {
      caughtError = err
    }

    expect(caughtError).toBeDefined()
    expect((caughtError as Error).message).toContain('NEXT_REDIRECT')
  })
})
