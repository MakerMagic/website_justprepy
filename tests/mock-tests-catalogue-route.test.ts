import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'

const mockRequirePageAuth = vi.fn()
vi.mock('../src/server/auth/require-auth', () => ({
  requirePageAuth: (...args: unknown[]) => mockRequirePageAuth(...args),
}))

const mockRedirect = vi.fn((url: string) => {
  const error = new Error(`NEXT_REDIRECT:${url}`)
  ;(error as unknown as { digest: string }).digest = `NEXT_REDIRECT;replace;${url};307;;`
  throw error
})

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}))

import MockTestsCataloguePage, {
  dynamic,
  metadata,
} from '../src/app/app/mock-tests/page'
import LegacyMockTestsPage from '../src/app/mock-tests/page'
import { MockTests } from '../src/modules/mock-tests/mock-tests'
import { demoMockTests } from '../src/modules/mock-tests/mock-tests.fixtures'
import { demoQuestionBank } from '../src/modules/questions/question-bank.fixtures'

describe('Canonical Mock Tests Catalogue Route (/app/mock-tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports force-dynamic to prevent public caching of authenticated catalogue state', () => {
    expect(dynamic).toBe('force-dynamic')
  })

  it('exports accurate mock tests metadata', () => {
    expect(metadata).toBeDefined()
    expect(metadata?.title).toBe('Mock Tests | JustPrepy')
    expect(metadata?.description).toContain('mock tests')
  })

  it('is a Server Component that explicitly invokes requirePageAuth with /app/mock-tests', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    await MockTestsCataloguePage()

    expect(mockRequirePageAuth).toHaveBeenCalledTimes(1)
    expect(mockRequirePageAuth).toHaveBeenCalledWith('/app/mock-tests')
  })

  it('runs the authentication guard strictly before rendering the catalogue component', async () => {
    const executionOrder: string[] = []

    mockRequirePageAuth.mockImplementationOnce(async () => {
      executionOrder.push('guard')
      return { userId: 'user-1', claims: { sub: 'user-1' } }
    })

    const element = await MockTestsCataloguePage()
    executionOrder.push('rendered')

    expect(executionOrder).toEqual(['guard', 'rendered'])
    expect(element).toBeDefined()
  })

  it('renders MockTests component with existing demo fixtures when authenticated', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const element = await MockTestsCataloguePage()

    expect(React.isValidElement(element)).toBe(true)
    expect(element.type).toBe(MockTests)
    expect(element.props.tests).toBe(demoMockTests)
    expect(element.props.profile).toBe(demoQuestionBank.profile)
    expect(element.props.telegramUrl).toBe(demoQuestionBank.telegramUrl)
  })

  it('fails closed and prevents rendering when the guard throws (unauthenticated redirect)', async () => {
    const redirectError = new Error('NEXT_REDIRECT:/login?next=%2Fapp%2Fmock-tests')
    ;(redirectError as unknown as { digest: string }).digest =
      'NEXT_REDIRECT;replace;/login?next=%2Fapp%2Fmock-tests;307;;'

    mockRequirePageAuth.mockRejectedValueOnce(redirectError)

    await expect(MockTestsCataloguePage()).rejects.toThrow(
      'NEXT_REDIRECT:/login?next=%2Fapp%2Fmock-tests'
    )
  })

  it('does not redirect authenticated users to /app or /mock-tests', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const element = await MockTestsCataloguePage()

    expect(React.isValidElement(element)).toBe(true)
    expect(element.type).toBe(MockTests)
  })
})

describe('Legacy Mock Tests Catalogue Route (/mock-tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects temporarily to /app/mock-tests when called without searchParams', async () => {
    await expect(LegacyMockTestsPage({})).rejects.toThrow(
      'NEXT_REDIRECT:/app/mock-tests'
    )
    expect(mockRedirect).toHaveBeenCalledWith('/app/mock-tests')
  })

  it('preserves query parameters on redirect to /app/mock-tests', async () => {
    const searchParams = Promise.resolve({
      subject: 'math',
      status: 'unsolved',
    })

    await expect(LegacyMockTestsPage({ searchParams })).rejects.toThrow(
      'NEXT_REDIRECT:/app/mock-tests?subject=math&status=unsolved'
    )
    expect(mockRedirect).toHaveBeenCalledWith(
      '/app/mock-tests?subject=math&status=unsolved'
    )
  })

  it('never renders MockTests catalogue or returns JSX from the legacy route', async () => {
    let returnedElement: unknown = null
    try {
      returnedElement = await LegacyMockTestsPage({})
    } catch {
      // Expected redirect throw
    }
    expect(returnedElement).toBeNull()
  })
})
