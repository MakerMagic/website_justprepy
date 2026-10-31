import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { demoMockTests } from '../../../../../modules/mock-tests/mock-tests.fixtures'
import { MockTestEntry } from '../../../../../modules/mock-tests/mock-test-taking'
import { requirePageAuth } from '../../../../../server/auth/require-auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mock Test | JustPrepy',
  description: 'Take official NUET simulation and sectional mock tests.',
}

export default async function MockTakePage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>
  searchParams: Promise<{
    attempt?: string | string[]
    mode?: string | string[]
  }>
}) {
  const { testId } = await params
  const { attempt, mode } = await searchParams

  if (Array.isArray(attempt) || Array.isArray(mode)) {
    notFound()
  }

  const queryParams = new URLSearchParams()
  if (typeof attempt === 'string' && attempt) {
    queryParams.set('attempt', attempt)
  }
  if (typeof mode === 'string' && mode) {
    queryParams.set('mode', mode)
  }
  const query = queryParams.toString()
  const returnPath = `/app/mock-tests/${encodeURIComponent(testId)}/take${query ? `?${query}` : ''}`

  await requirePageAuth(returnPath)

  const test = demoMockTests.find((item) => item.id === testId)
  if (!test) {
    notFound()
  }

  return (
    <MockTestEntry
      key={test.id}
      test={test}
      attemptId={attempt}
      retake={mode === 'retake'}
    />
  )
}
