import type {
  DemoPracticeFeedback,
  PracticeResponse,
} from "../questions/practice.types";
import { demoPracticeFeedback } from "../questions/practice.fixtures";
import {
  demoExamQuestions,
  attemptQuestionMetadata,
  examSectionNames,
  validateDemoAttempt,
  type DemoMockAttempt,
  type ExamQuestion,
} from "./mock-test-attempt.logic";
import type { MockTest } from "./mock-tests.types";
export interface CompletedQuestionReview {
  question: ExamQuestion;
  feedback: DemoPracticeFeedback | undefined;
  response: PracticeResponse;
}
export type CompletedMockReviews = Record<string, CompletedQuestionReview>;
/** Only completed, matching demo attempts can release their original authored practice material. */
export function completedDemoReviews(
  test: MockTest,
  attempt: DemoMockAttempt,
): CompletedMockReviews {
  if (attempt.completedAt === null || !validateDemoAttempt(attempt, test))
    return {};
  return Object.fromEntries(
    demoExamQuestions(test)
      .filter((question) => {
        const recorded = attempt.analytics?.questions.find(
          (row) => row.id === question.id,
        );
        return (
          !recorded ||
          recorded.sourceRevision ===
            attemptQuestionMetadata(question).sourceRevision
        );
      })
      .map((question) => {
        const selected = attempt.answers[question.id] ?? null,
          feedback = demoPracticeFeedback[question.sourceId];
        return [
          question.id,
          {
            question: {
              ...question,
              section: examSectionNames[question.examSection],
            },
            feedback,
            response: {
              selected,
              checked: selected !== null,
              saved: false,
              attempts: selected ? [selected] : [],
              outcome:
                selected && feedback
                  ? selected === feedback.correctOptionId
                    ? "correct"
                    : "wrong"
                  : undefined,
            },
          } satisfies CompletedQuestionReview,
        ];
      }),
  );
}
