import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('next/navigation', () => ({
  usePathname: () => '/app',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

const mockRequirePageAuth = vi.fn()
vi.mock('../src/server/auth/require-auth', () => ({
  requirePageAuth: (...args: unknown[]) => mockRequirePageAuth(...args),
}))

import { Sidebar } from '../src/modules/questions/sidebar'
import { demoQuestionBank } from '../src/modules/questions/question-bank.fixtures'
import AppPage from '../src/app/app/page'
import QuestionBankPracticePage from '../src/app/app/question-bank/practice/page'
import { isAppPath } from '../src/server/supabase/proxy-client'

describe('Auth Navigation Regression Suite (tests/auth-navigation-regression.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Sidebar Question Bank link regression fix', () => {
    it('targets /app as the Question Bank link to avoid routing authenticated users to the public landing page', () => {
      const html = renderToStaticMarkup(
        React.createElement(Sidebar, { profile: demoQuestionBank.profile })
      )

      // Desktop navigation item for Question Bank must point to /app
      expect(html).toContain('href="/app"')
      expect(html).toContain('title="Question Bank"')

      // Must not link Question Bank to the public landing page root (/)
      expect(html).not.toMatch(/<a[^>]+href="\/"[^>]*title="Question Bank"/)
    })

    it('targets /app in the mobile navigation dock', () => {
      const html = renderToStaticMarkup(
        React.createElement(Sidebar, { profile: demoQuestionBank.profile })
      )

      // Mobile dock link for Question Bank
      expect(html).toMatch(/<a[^>]+href="\/app"[^>]*>[\s\S]*?Question Bank[\s\S]*?<\/a>/)
    })

    it('targets /app for the sidebar brand logo with aria-label="JustPrepy question bank"', () => {
      const html = renderToStaticMarkup(
        React.createElement(Sidebar, { profile: demoQuestionBank.profile })
      )

      // Logo brand link inside app
      expect(html).toMatch(/<a[^>]*class="sidebar-logo"[^>]*href="\/app"/)
    })

    it('identifies /app as part of the protected app namespace in proxy matching', () => {
      expect(isAppPath('/app')).toBe(true)
      expect(isAppPath('/app/question-bank/practice')).toBe(true)
      expect(isAppPath('/')).toBe(false)
    })
  })

  describe('Protected navigation between /app and /app/question-bank/practice', () => {
    it('allows seamless navigation between both protected pages when a valid session exists', async () => {
      const mockSession = {
        userId: 'session-user-123',
        claims: { sub: 'session-user-123' },
      }
      mockRequirePageAuth.mockResolvedValue(mockSession)

      // Navigating to /app
      const appPage = await AppPage()
      expect(React.isValidElement(appPage)).toBe(true)
      expect(mockRequirePageAuth).toHaveBeenCalledWith('/app')

      // Navigating from /app to /app/question-bank/practice
      const practicePage = await QuestionBankPracticePage()
      expect(React.isValidElement(practicePage)).toBe(true)
      expect(mockRequirePageAuth).toHaveBeenCalledWith('/app/question-bank/practice')

      // Navigating back to /app via Sidebar (which now points to /app)
      const appPageReturn = await AppPage()
      expect(React.isValidElement(appPageReturn)).toBe(true)
      expect(mockRequirePageAuth).toHaveBeenLastCalledWith('/app')
    })

    it('fails closed and blocks both protected pages when the session is unauthenticated', async () => {
      const redirectError = new Error('NEXT_REDIRECT:/login')
      mockRequirePageAuth.mockRejectedValue(redirectError)

      await expect(AppPage()).rejects.toThrow('NEXT_REDIRECT:/login')
      await expect(QuestionBankPracticePage()).rejects.toThrow('NEXT_REDIRECT:/login')
    })
  })
})
