import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockExchangeCodeForSession = vi.fn()
const mockCreateClient = vi.fn(() => ({
  auth: {
    exchangeCodeForSession: mockExchangeCodeForSession,
  },
}))

vi.mock('../src/server/supabase/server-client', () => ({
  createClient: () => mockCreateClient(),
}))

import { GET, getSafeRedirectUrl } from '../src/app/auth/callback/route'

function createCallbackRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'))
}

describe('Auth Callback Route Handler (src/app/auth/callback/route.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExchangeCodeForSession.mockResolvedValue({ error: null })
  })

  describe('getSafeRedirectUrl helper', () => {
    it('defaults strictly to /app when nextParam is null or undefined', () => {
      expect(getSafeRedirectUrl(null, 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
      expect(getSafeRedirectUrl(undefined as unknown as string, 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
    })

    it('defaults to /app when nextParam is an empty string', () => {
      expect(getSafeRedirectUrl('', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
    })

    it('preserves valid internal paths under /app or other internal destinations', () => {
      expect(getSafeRedirectUrl('/app', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
      expect(getSafeRedirectUrl('/app/mock-tests', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app/mock-tests'
      )
      expect(getSafeRedirectUrl('/app/mock-tests?attempt=1', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app/mock-tests?attempt=1'
      )
    })

    it('rejects protocol-relative open redirect attempts and falls back to /app', () => {
      expect(getSafeRedirectUrl('//evil.com', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
      expect(getSafeRedirectUrl('//evil.com/app', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
      expect(getSafeRedirectUrl('/\\evil.com', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
    })

    it('rejects external URLs and falls back to /app', () => {
      expect(getSafeRedirectUrl('https://evil.com', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
      expect(getSafeRedirectUrl('http://evil.com/app', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
      expect(getSafeRedirectUrl('javascript:alert(1)', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
    })

    it('rejects URLs containing backslashes or control characters', () => {
      expect(getSafeRedirectUrl('/app\\evil', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
      expect(getSafeRedirectUrl('/app\x00evil', 'http://localhost:3000/auth/callback').toString()).toBe(
        'http://localhost:3000/app'
      )
    })
  })

  describe('GET handler OAuth flow', () => {
    it('redirects to /app by default upon successful PKCE code exchange with no next parameter', async () => {
      mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

      const req = createCallbackRequest('http://localhost:3000/auth/callback?code=valid-auth-code')
      const response = await GET(req)

      expect(mockExchangeCodeForSession).toHaveBeenCalledTimes(1)
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('valid-auth-code')

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/app')
      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate, private')
      expect(response.headers.get('Pragma')).toBe('no-cache')
    })

    it('completes PKCE session exchange BEFORE issuing the success redirect', async () => {
      const callLog: string[] = []

      mockExchangeCodeForSession.mockImplementationOnce(async (code: string) => {
        callLog.push(`exchanged:${code}`)
        return { error: null }
      })

      const req = createCallbackRequest('http://localhost:3000/auth/callback?code=test-exchange-order')
      const response = await GET(req)

      expect(callLog).toEqual(['exchanged:test-exchange-order'])
      expect(response.headers.get('location')).toBe('http://localhost:3000/app')
    })

    it('honors a valid next parameter when provided and safe', async () => {
      mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

      const req = createCallbackRequest(
        'http://localhost:3000/auth/callback?code=valid-code&next=%2Fapp%2Fmock-tests'
      )
      const response = await GET(req)

      expect(response.headers.get('location')).toBe('http://localhost:3000/app/mock-tests')
    })

    it('ignores unsafe external next destination and defaults to /app', async () => {
      mockExchangeCodeForSession.mockResolvedValueOnce({ error: null })

      const req = createCallbackRequest(
        'http://localhost:3000/auth/callback?code=valid-code&next=https%3A%2F%2Fevil.com'
      )
      const response = await GET(req)

      expect(response.headers.get('location')).toBe('http://localhost:3000/app')
    })

    it('handles provider error: access_denied redirects to /login?error=oauth_cancelled', async () => {
      const req = createCallbackRequest(
        'http://localhost:3000/auth/callback?error=access_denied&error_description=User+cancelled'
      )
      const response = await GET(req)

      expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=oauth_cancelled')
    })

    it('handles other provider errors by redirecting to /login?error=oauth_error', async () => {
      const req = createCallbackRequest(
        'http://localhost:3000/auth/callback?error=server_error&error_description=Internal'
      )
      const response = await GET(req)

      expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=oauth_error')
    })

    it('handles missing authorization code by redirecting to /login?error=missing_code', async () => {
      const req = createCallbackRequest('http://localhost:3000/auth/callback')
      const response = await GET(req)

      expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=missing_code')
    })

    it('handles code exchange failure by redirecting to /login?error=auth_exchange_failed', async () => {
      mockExchangeCodeForSession.mockResolvedValueOnce({
        error: new Error('Invalid PKCE grant code'),
      })

      const req = createCallbackRequest('http://localhost:3000/auth/callback?code=bad-code')
      const response = await GET(req)

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('bad-code')
      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/login?error=auth_exchange_failed'
      )
    })

    it('handles unexpected exceptions during code exchange by redirecting to /login?error=auth_exchange_failed', async () => {
      mockExchangeCodeForSession.mockRejectedValueOnce(new Error('Network timeout'))

      const req = createCallbackRequest('http://localhost:3000/auth/callback?code=timeout-code')
      const response = await GET(req)

      expect(response.headers.get('location')).toBe(
        'http://localhost:3000/login?error=auth_exchange_failed'
      )
    })
  })
})
