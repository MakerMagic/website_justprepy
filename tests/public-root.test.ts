import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import HomePage, { metadata } from '../src/app/page'

// Verify AppPage in /app remains intact and protected
const mockRequirePageAuth = vi.fn()
vi.mock('../src/server/auth/require-auth', () => ({
  requirePageAuth: (...args: unknown[]) => mockRequirePageAuth(...args),
}))

import AppPage from '../src/app/app/page'
import { QuestionBank } from '../src/modules/questions/question-bank'

describe('Public Root Landing Page (src/app/page.tsx)', () => {
  it('renders the minimal public homepage with semantic HTML', () => {
    const html = renderToStaticMarkup(React.createElement(HomePage))

    expect(html).toContain('<main')
    expect(html).toContain('<h1>JustPrepy</h1>')
    expect(html).toContain('Welcome to JustPrepy')
  })

  it('renders working links to /login and /signup', () => {
    const html = renderToStaticMarkup(React.createElement(HomePage))

    expect(html).toContain('href="/login"')
    expect(html).toContain('Log in')
    expect(html).toContain('href="/signup"')
    expect(html).toContain('Sign up')
  })

  it('does NOT invoke private authentication or require an authenticated session', () => {
    // Calling HomePage directly must not require any auth mocks or throw redirect errors
    expect(() => renderToStaticMarkup(React.createElement(HomePage))).not.toThrow()
    expect(mockRequirePageAuth).not.toHaveBeenCalled()
  })

  it('does NOT render Question Bank or its practice workspace', () => {
    const html = renderToStaticMarkup(React.createElement(HomePage))

    // Ensure QuestionBank elements, filters, and stats are not present on the public root
    expect(html).not.toContain('practice-shell')
    expect(html).not.toContain('bank-content')
    expect(html).not.toContain('Question Bank')
    expect(html).not.toContain('role="dialog"')
  })

  it('exports appropriate public metadata', () => {
    expect(metadata).toBeDefined()
    expect(metadata.title).toBe('JustPrepy')
    expect(metadata.description).toContain('JustPrepy')
  })

  it('confirms the protected /app route remains intact and requires authentication', async () => {
    mockRequirePageAuth.mockResolvedValueOnce({
      userId: 'test-user',
      claims: { sub: 'test-user' },
    })

    const appElement = await AppPage()

    expect(mockRequirePageAuth).toHaveBeenCalledWith('/app')
    expect(React.isValidElement(appElement)).toBe(true)
    expect(appElement.type).toBe(QuestionBank)
  })
})
