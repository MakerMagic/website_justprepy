import type { Metadata } from 'next'
import { QuestionBank } from '../../modules/questions/question-bank'
import { demoQuestionBank } from '../../modules/questions/question-bank.fixtures'
import { requirePageAuth } from '../../server/auth/require-auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Question bank | JustPrepy',
  description:
    'Explore Critical Thinking, Problem Solving and Mathematics topics for NUET preparation.',
}

export default async function AppPage() {
  await requirePageAuth('/app')

  return <QuestionBank data={demoQuestionBank} />
}
