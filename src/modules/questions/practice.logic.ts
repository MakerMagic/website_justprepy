import type { DemoPracticeFeedback, PracticeResponse } from "./practice.types";

export const emptyPracticeResponse: PracticeResponse = {
  selected: null,
  checked: false,
  saved: false,
  attempts: [],
};
export type PracticeStatus = "correct" | "partial" | "wrong" | "unanswered";

/** Called only for a nonempty history of completed evaluations. */
function attemptOutcome(attempts: string[], correctOptionId: string) {
  const confirmedAt = attempts.indexOf(correctOptionId);
  return confirmedAt < 0 ? "wrong" : confirmedAt === 0 ? "correct" : "partial";
}

export function practiceStatus(
  response: PracticeResponse | undefined,
  feedback: DemoPracticeFeedback | undefined,
): PracticeStatus {
  if (!response || !feedback) return "unanswered";
  return response.outcome ?? "unanswered";
}

export function practiceResolved(response: PracticeResponse) {
  return (
    response.attempts.length > 0 &&
    (response.outcome === "correct" || response.outcome === "partial")
  );
}

export function optionResult(
  optionId: string,
  response: PracticeResponse,
  feedback: DemoPracticeFeedback | undefined,
  visible = true,
) {
  if (!visible || !feedback || !response.attempts.includes(optionId))
    return undefined;
  return optionId === feedback.correctOptionId ? "correct" : "wrong";
}

/** Leaving a question clears only its visit; the last evaluated result and bookmark persist. */
export function resetPracticeVisit(
  responses: Record<string, PracticeResponse>,
  id: string,
) {
  const current = responses[id];
  if (!current) return responses;
  return {
    ...responses,
    [id]: { ...current, selected: null, checked: false, attempts: [] },
  };
}

/** Changing a failed selection prepares a retry without erasing completed attempts. */
export function updatePracticeResponse(
  responses: Record<string, PracticeResponse>,
  id: string,
  update: Partial<Pick<PracticeResponse, "selected" | "saved">>,
) {
  const current = responses[id] ?? emptyPracticeResponse;
  const next = { ...current, ...update };
  if (practiceResolved(current)) {
    next.selected = current.selected;
  } else if (next.selected !== current.selected) {
    next.checked =
      next.selected !== null && current.attempts.includes(next.selected);
  }
  return { ...responses, [id]: next };
}

/** Local grading is confined to authored demo feedback. A checked selection counts once. */
export function checkPracticeResponse(
  responses: Record<string, PracticeResponse>,
  id: string,
  feedback: DemoPracticeFeedback | undefined,
) {
  const current = responses[id] ?? emptyPracticeResponse;
  if (
    !feedback ||
    !current.selected ||
    current.checked ||
    current.attempts.includes(current.selected) ||
    practiceResolved(current)
  )
    return responses;
  const attempts = [...current.attempts, current.selected];
  const outcome = attemptOutcome(attempts, feedback.correctOptionId);
  return {
    ...responses,
    [id]: {
      ...current,
      checked: true,
      attempts,
      outcome,
    } satisfies PracticeResponse,
  };
}

export function navigatorTarget(
  index: number,
  key: string,
  count: number,
  columns: number,
) {
  const targets: Record<string, number> = {
    ArrowRight: index + 1,
    ArrowLeft: index - 1,
    ArrowDown: index + columns,
    ArrowUp: index - columns,
    Home: 0,
    End: count - 1,
  };
  return key in targets ? Math.max(0, Math.min(count - 1, targets[key])) : null;
}
