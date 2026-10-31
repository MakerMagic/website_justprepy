import type { Metadata } from 'next'
import { MockTests } from '../../../modules/mock-tests/mock-tests'
import { demoMockTests } from '../../../modules/mock-tests/mock-tests.fixtures'
import { demoQuestionBank } from '../../../modules/questions/question-bank.fixtures'
import { requirePageAuth } from '../../../server/auth/require-auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mock Tests | JustPrepy',
  description:
    'Browse full simulations and focused Critical Thinking, Problem Solving and Mathematics mock tests.',
}

export default async function MockTestsCataloguePage() {
  await requirePageAuth('/app/mock-tests')

  return (
    <MockTests
      tests={demoMockTests}
      profile={demoQuestionBank.profile}
      telegramUrl={demoQuestionBank.telegramUrl}
    />
  )
}
