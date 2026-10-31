import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'

const mockRequirePageAuth = vi.fn()

vi.mock('../src/server/auth/require-auth', () => ({
  requirePageAuth: (...args: unknown[]) => mockRequirePageAuth(...args),
}))

import AppPage, { dynamic, metadata } from '../src/app/app/page'
import { QuestionBank } from '../src/modules/questions/question-bank'
import { demoQuestionBank } from '../src/modules/questions/question-bank.fixtures'

describe('/app Entry Page (src/app/app/page.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports force-dynamic to prevent inappropriate public static caching', () => {
    expect(dynamic).toBe('force-dynamic')
  })

  it('exports metadata for the Question Bank page', () => {
    expect(metadata).toBeDefined()
    expect(metadata?.title).toBe('Question bank | JustPrepy')
    expect(metadata?.description).toContain('NUET preparation')
  })

  it('is a Server Component that explicitly invokes requirePageAuth with /app', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'user-123',
      claims: { sub: 'user-123' },
    })

    await AppPage()

    expect(mockRequirePageAuth).toHaveBeenCalledTimes(1)
    expect(mockRequirePageAuth).toHaveBeenCalledWith('/app')
  })

  it('runs the authentication guard before rendering protected content', async () => {
    const executionOrder: string[] = []

    mockRequirePageAuth.mockImplementationOnce(async () => {
      executionOrder.push('guard')
      return { userId: 'user-123', claims: { sub: 'user-123' } }
    })

    const element = await AppPage()
    executionOrder.push('rendered')

    expect(executionOrder).toEqual(['guard', 'rendered'])
    expect(element).toBeDefined()
  })

  it('allows rendering when an authenticated session is verified', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'user-123',
      claims: { sub: 'user-123' },
    })

    const element = await AppPage()

    expect(element).toBeDefined()
    expect(React.isValidElement(element)).toBe(true)
    expect(element.type).toBe(QuestionBank)
  })

  it('fails closed and prevents rendering when the guard throws (unauthenticated redirect)', async () => {
    const redirectError = new Error('NEXT_REDIRECT:/login?next=%2Fapp')
    ;(redirectError as unknown as { digest: string }).digest =
      'NEXT_REDIRECT;replace;/login?next=%2Fapp;307;;'

    mockRequirePageAuth.mockRejectedValueOnce(redirectError)

    await expect(AppPage()).rejects.toThrow('NEXT_REDIRECT:/login?next=%2Fapp')
  })

  it('uses the existing Question Bank implementation without duplicating business logic', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'user-123',
      claims: { sub: 'user-123' },
    })

    const element = await AppPage()

    // Verifies reuse of the exact existing QuestionBank component
    expect(element.type).toBe(QuestionBank)

    // Verifies data passed is the existing demoQuestionBank fixture
    expect(element.props.data).toBe(demoQuestionBank)
    expect(element.props.data.questions.length).toBeGreaterThan(0)
    expect(element.props.data.profile).toBeDefined()
  })

  it('is the actual Question Bank page and not a redirect to /practice, /app/practice, or a dashboard', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'user-123',
      claims: { sub: 'user-123' },
    })

    const element = await AppPage()

    // Returns React element directly, never redirects or returns null
    expect(React.isValidElement(element)).toBe(true)
    expect(element.type).toBe(QuestionBank)
  })

  it('does not introduce new Question Bank state or modified props', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'user-123',
      claims: { sub: 'user-123' },
    })

    const element = await AppPage()
    const propKeys = Object.keys(element.props)

    // Exactly only 'data' prop passed to QuestionBank, matching src/app/page.tsx
    expect(propKeys).toEqual(['data'])
  })

  it('enforces page-level authentication independently of any shared layout', async () => {
    // The AppPage function itself directly invokes requirePageAuth
    // ensuring protection even if layout or middleware is bypassed or altered
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'user-test',
      claims: { sub: 'user-test' },
    })

    expect(typeof AppPage).toBe('function')
    await AppPage()
    expect(mockRequirePageAuth).toHaveBeenCalledWith('/app')
  })
})
