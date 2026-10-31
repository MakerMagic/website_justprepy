import type { Metadata } from 'next'
import { QuestionSolver } from '../../../../modules/questions/question-solver'
import {
  demoPracticeFeedback,
  demoPracticeQuestions,
} from '../../../../modules/questions/practice.fixtures'
import { demoQuestionBank } from '../../../../modules/questions/question-bank.fixtures'
import { requirePageAuth } from '../../../../server/auth/require-auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Question practice | JustPrepy',
  description:
    'Try the JustPrepy question-solving interface with illustrative practice questions.',
}

export default async function QuestionBankPracticePage() {
  await requirePageAuth('/app/question-bank/practice')

  return (
    <QuestionSolver
      questions={demoPracticeQuestions}
      feedback={demoPracticeFeedback}
      profile={demoQuestionBank.profile}
      telegramUrl={demoQuestionBank.telegramUrl}
    />
  )
}
