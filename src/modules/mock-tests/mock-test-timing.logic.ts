import type { DemoMockAttempt } from "./mock-test-attempt.logic";
export interface QuestionTimingCursor {
  id: string;
  at: number;
  visible: boolean;
}
/** Only observed visible time. Refresh, hidden tabs and Save & Exit never become invented dwell time. */
export function observeQuestionTime(
  attempt: DemoMockAttempt,
  cursor: QuestionTimingCursor | null,
  now: number,
  visible: boolean,
  deadline: number,
) {
  const end = Math.min(now, deadline);
  const nextCursor = { id: attempt.currentId, at: now, visible };
  if (
    !attempt.analytics ||
    attempt.completedAt !== null ||
    !cursor ||
    !cursor.visible ||
    cursor.id !== attempt.currentId
  )
    return { attempt, cursor: nextCursor };
  const delta = Math.max(
    0,
    end -
      Math.max(
        attempt.startedAt,
        cursor.at,
        attempt.analytics.observedThrough ?? 0,
      ),
  );
  if (!delta) return { attempt, cursor: nextCursor };
  const previous = attempt.analytics.questionTimeMs[cursor.id] ?? 0;
  return {
    cursor: nextCursor,
    attempt: {
      ...attempt,
      analytics: {
        ...attempt.analytics,
        observedThrough: end,
        questionTimeMs: {
          ...attempt.analytics.questionTimeMs,
          [cursor.id]: previous + delta,
        },
      },
    },
  };
}
