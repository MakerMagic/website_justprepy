import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import fs from 'node:fs'
import path from 'node:path'

const mockRequirePageAuth = vi.fn()
vi.mock('../src/server/auth/require-auth', () => ({
  requirePageAuth: (...args: unknown[]) => mockRequirePageAuth(...args),
}))

const mockNotFound = vi.fn(() => {
  const error = new Error('NEXT_NOT_FOUND')
  ;(error as unknown as { digest: string }).digest = 'NEXT_NOT_FOUND'
  throw error
})

vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

import MockTakePage, {
  dynamic,
  metadata,
} from '../src/app/app/mock-tests/[testId]/take/page'
import { MockTestEntry } from '../src/modules/mock-tests/mock-test-taking'
import { demoMockTests } from '../src/modules/mock-tests/mock-tests.fixtures'
import { demoTakeHref } from '../src/modules/mock-tests/mock-test-attempt.logic'

describe('Canonical Mock Test Taking Route (/app/mock-tests/[testId]/take)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exports force-dynamic to prevent static caching of authenticated mock test state', () => {
    expect(dynamic).toBe('force-dynamic')
  })

  it('exports valid metadata for mock test taking', () => {
    expect(metadata).toBeDefined()
    expect(metadata?.title).toBe('Mock Test | JustPrepy')
    expect(metadata?.description).toContain('mock tests')
  })

  it('invokes requirePageAuth with canonical path including testId', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const params = Promise.resolve({ testId: 'demo-mock-1' })
    const searchParams = Promise.resolve({})

    await MockTakePage({ params, searchParams })

    expect(mockRequirePageAuth).toHaveBeenCalledTimes(1)
    expect(mockRequirePageAuth).toHaveBeenCalledWith('/app/mock-tests/demo-mock-1/take')
  })

  it('preserves attempt and mode query parameters when invoking requirePageAuth', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const params = Promise.resolve({ testId: 'demo-mock-1' })
    const searchParams = Promise.resolve({
      attempt: 'attempt-123',
      mode: 'retake',
    })

    await MockTakePage({ params, searchParams })

    expect(mockRequirePageAuth).toHaveBeenCalledWith(
      '/app/mock-tests/demo-mock-1/take?attempt=attempt-123&mode=retake'
    )
  })

  it('runs requirePageAuth strictly before rendering educational content', async () => {
    const executionOrder: string[] = []

    mockRequirePageAuth.mockImplementationOnce(async () => {
      executionOrder.push('guard')
      return { userId: 'user-1', claims: { sub: 'user-1' } }
    })

    const params = Promise.resolve({ testId: 'demo-mock-1' })
    const searchParams = Promise.resolve({})

    const element = await MockTakePage({ params, searchParams })
    executionOrder.push('rendered')

    expect(executionOrder).toEqual(['guard', 'rendered'])
    expect(element).toBeDefined()
  })

  it('renders MockTestEntry with matching test, attemptId, and retake flag when authenticated', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const targetTest = demoMockTests[0]
    const params = Promise.resolve({ testId: targetTest.id })
    const searchParams = Promise.resolve({
      attempt: 'custom-attempt-42',
      mode: 'retake',
    })

    const element = await MockTakePage({ params, searchParams })

    expect(React.isValidElement(element)).toBe(true)
    expect(element.type).toBe(MockTestEntry)
    expect(element.props.test).toEqual(targetTest)
    expect(element.props.attemptId).toBe('custom-attempt-42')
    expect(element.props.retake).toBe(true)
  })

  it('defaults retake to false when mode is not retake', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const targetTest = demoMockTests[1]
    const params = Promise.resolve({ testId: targetTest.id })
    const searchParams = Promise.resolve({})

    const element = await MockTakePage({ params, searchParams })

    expect(React.isValidElement(element)).toBe(true)
    expect(element.type).toBe(MockTestEntry)
    expect(element.props.test).toEqual(targetTest)
    expect(element.props.retake).toBe(false)
  })

  it('fails closed and blocks rendering when requirePageAuth throws redirect error', async () => {
    const redirectError = new Error(
      'NEXT_REDIRECT:/login?next=%2Fapp%2Fmock-tests%2Fdemo-mock-1%2Ftake'
    )
    ;(redirectError as unknown as { digest: string }).digest =
      'NEXT_REDIRECT;replace;/login?next=%2Fapp%2Fmock-tests%2Fdemo-mock-1%2Ftake;307;;'

    mockRequirePageAuth.mockRejectedValueOnce(redirectError)

    const params = Promise.resolve({ testId: 'demo-mock-1' })
    const searchParams = Promise.resolve({})

    await expect(MockTakePage({ params, searchParams })).rejects.toThrow(
      'NEXT_REDIRECT:/login?next=%2Fapp%2Fmock-tests%2Fdemo-mock-1%2Ftake'
    )
  })

  it('invokes notFound() when testId does not exist in demo tests', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const params = Promise.resolve({ testId: 'non-existent-test-id' })
    const searchParams = Promise.resolve({})

    await expect(MockTakePage({ params, searchParams })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )
    expect(mockNotFound).toHaveBeenCalledTimes(1)
  })

  it('invokes notFound() when attempt or mode searchParams are arrays (malformed query)', async () => {
    const params = Promise.resolve({ testId: 'demo-mock-1' })
    const searchParams = Promise.resolve({
      attempt: ['id1', 'id2'],
    })

    await expect(MockTakePage({ params, searchParams })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )
    expect(mockNotFound).toHaveBeenCalledTimes(1)
  })
})

describe('Canonical Taking Link Generator (demoTakeHref)', () => {
  it('generates canonical /app/mock-tests/.../take URL without attempt', () => {
    expect(demoTakeHref('demo-mock-1')).toBe('/app/mock-tests/demo-mock-1/take')
  })

  it('generates canonical /app/mock-tests/.../take URL with attempt parameter', () => {
    expect(demoTakeHref('demo-mock-2', 'att-99')).toBe(
      '/app/mock-tests/demo-mock-2/take?attempt=att-99'
    )
  })

  it('URL-encodes testId and attemptId components correctly', () => {
    expect(demoTakeHref('test with spaces', 'att/special#1')).toBe(
      '/app/mock-tests/test%20with%20spaces/take?attempt=att%2Fspecial%231'
    )
  })
})

describe('Legacy Taking Route Deletion Integrity', () => {
  it('confirms the legacy route file src/app/mock-tests/[testId]/take/page.tsx does not exist', () => {
    const legacyPath = path.resolve(
      process.cwd(),
      'src/app/mock-tests/[testId]/take/page.tsx'
    )
    expect(fs.existsSync(legacyPath)).toBe(false)
  })
})
