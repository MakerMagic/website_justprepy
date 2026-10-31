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

import QuestionBankPracticePage, {
  dynamic,
  metadata,
} from '../src/app/app/question-bank/practice/page'
import LegacyPracticePage from '../src/app/practice/page'
import { QuestionSolver } from '../src/modules/questions/question-solver'
import {
  demoPracticeFeedback,
  demoPracticeQuestions,
} from '../src/modules/questions/practice.fixtures'
import { demoQuestionBank } from '../src/modules/questions/question-bank.fixtures'

describe('Question Bank Practice Canonical Route (/app/question-bank/practice)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports force-dynamic to prevent public caching of authenticated solver state', () => {
    expect(dynamic).toBe('force-dynamic')
  })

  it('exports practice page metadata', () => {
    expect(metadata).toBeDefined()
    expect(metadata?.title).toBe('Question practice | JustPrepy')
    expect(metadata?.description).toContain('question-solving interface')
  })

  it('is a Server Component that explicitly calls requirePageAuth with /app/question-bank/practice', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    await QuestionBankPracticePage()

    expect(mockRequirePageAuth).toHaveBeenCalledTimes(1)
    expect(mockRequirePageAuth).toHaveBeenCalledWith('/app/question-bank/practice')
  })

  it('runs the authentication guard before rendering the solver component', async () => {
    const executionOrder: string[] = []

    mockRequirePageAuth.mockImplementationOnce(async () => {
      executionOrder.push('guard')
      return { userId: 'user-1', claims: { sub: 'user-1' } }
    })

    const element = await QuestionBankPracticePage()
    executionOrder.push('rendered')

    expect(executionOrder).toEqual(['guard', 'rendered'])
    expect(element).toBeDefined()
  })

  it('renders QuestionSolver with existing demo fixtures and profile when authenticated', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const element = await QuestionBankPracticePage()

    expect(React.isValidElement(element)).toBe(true)
    expect(element.type).toBe(QuestionSolver)
    expect(element.props.questions).toBe(demoPracticeQuestions)
    expect(element.props.feedback).toBe(demoPracticeFeedback)
    expect(element.props.profile).toBe(demoQuestionBank.profile)
    expect(element.props.telegramUrl).toBe(demoQuestionBank.telegramUrl)
  })

  it('fails closed and prevents QuestionSolver from rendering when unauthenticated', async () => {
    const redirectError = new Error('NEXT_REDIRECT:/login?next=%2Fapp%2Fquestion-bank%2Fpractice')
    ;(redirectError as unknown as { digest: string }).digest =
      'NEXT_REDIRECT;replace;/login?next=%2Fapp%2Fquestion-bank%2Fpractice;307;;'

    mockRequirePageAuth.mockRejectedValueOnce(redirectError)

    await expect(QuestionBankPracticePage()).rejects.toThrow(
      'NEXT_REDIRECT:/login?next=%2Fapp%2Fquestion-bank%2Fpractice'
    )
  })

  it('does not redirect authenticated users to /app or /practice', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const element = await QuestionBankPracticePage()

    // Returns the component directly without throwing redirect
    expect(React.isValidElement(element)).toBe(true)
    expect(element.type).toBe(QuestionSolver)
  })
})

describe('Legacy Practice Route (/practice)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects temporarily to /app/question-bank/practice when called without searchParams', async () => {
    await expect(LegacyPracticePage({})).rejects.toThrow(
      'NEXT_REDIRECT:/app/question-bank/practice'
    )
    expect(mockRedirect).toHaveBeenCalledWith('/app/question-bank/practice')
  })

  it('preserves query parameters on redirect to /app/question-bank/practice', async () => {
    const searchParams = Promise.resolve({
      subject: 'math',
      topic: 'algebra',
    })

    await expect(LegacyPracticePage({ searchParams })).rejects.toThrow(
      'NEXT_REDIRECT:/app/question-bank/practice?subject=math&topic=algebra'
    )
    expect(mockRedirect).toHaveBeenCalledWith(
      '/app/question-bank/practice?subject=math&topic=algebra'
    )
  })

  it('never renders QuestionSolver or returns JSX from the legacy route', async () => {
    // Legacy route must always trigger a redirect and never return a component
    let returnedElement: unknown = null
    try {
      returnedElement = await LegacyPracticePage({})
    } catch {
      // Expected redirect throw
    }
    expect(returnedElement).toBeNull()
  })
})
