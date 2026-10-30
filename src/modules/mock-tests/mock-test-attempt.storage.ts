import {
  validateDemoAttempt,
  finishDemoAttempt,
  attemptDeadline,
  demoAttemptResult,
  DEMO_ATTEMPT_OWNER,
  type DemoMockAttempt,
} from "./mock-test-attempt.logic";
import type { MockTest } from "./mock-tests.types";
const prefix = "justprepy:demo-mock:v1:";
export const demoAttemptEvent = "justprepy-demo-mock-change";
/** Browser-only, non-authoritative demo storage. Never used for published tests or real results. */
export function readDemoAttempts(
  test: MockTest,
  storage: Storage = localStorage,
): DemoMockAttempt[] {
  const attempts: DemoMockAttempt[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix + test.id + ":")) continue;
    try {
      const candidate: unknown = JSON.parse(storage.getItem(key) ?? "null");
      if (
        validateDemoAttempt(candidate, test) &&
        (!candidate.analytics ||
          candidate.analytics.ownerId === DEMO_ATTEMPT_OWNER)
      )
        attempts.push(candidate);
    } catch {
      /* Ignore corrupt demo records; never overwrite them silently. */
    }
  }
  return attempts.sort((a, b) => b.startedAt - a.startedAt);
}
export function saveDemoAttempt(
  attempt: DemoMockAttempt,
  storage: Storage = localStorage,
) {
  const key = prefix + attempt.testId + ":" + attempt.id;
  const existing = storage.getItem(key);
  // Completed demo history is immutable, including duplicate Finish clicks / stale tabs.
  if (existing) {
    const saved = JSON.parse(existing) as DemoMockAttempt;
    if (saved.completedAt !== null) {
      if (JSON.stringify(saved) === JSON.stringify(attempt)) return;
      throw new Error(
        "This attempt has already been finished. Reload to view its results.",
      );
    }
  }
  storage.setItem(key, JSON.stringify(attempt));
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(demoAttemptEvent));
}

/** One idempotent finalization boundary for manual Finish, timeout and expired resume.
 * Web Locks serialize competing browser tabs; the existing single storage key retains one result.
 * This is the existing demo boundary, never a replacement for server assessment transactions.
 */
export async function finalizeDemoAttempt(
  test: MockTest,
  attempt: DemoMockAttempt,
  now: number,
  storage: Storage = localStorage,
): Promise<DemoMockAttempt> {
  const finalize = () => {
    const raw = storage.getItem(prefix + test.id + ":" + attempt.id);
    const saved: unknown = JSON.parse(raw ?? "null");
    if (!validateDemoAttempt(saved, test) || saved.id !== attempt.id)
      throw Error(
        "The saved attempt is unavailable. Your answers have not been submitted.",
      );
    if (saved.completedAt !== null) return saved;
    let completed = finishDemoAttempt(
      saved,
      Math.min(now, attemptDeadline(test, saved)),
    );
    if (completed.analytics)
      completed = {
        ...completed,
        analytics: {
          ...completed.analytics,
          result: demoAttemptResult(test, completed)!.result!,
        },
      };
    saveDemoAttempt(completed, storage);
    return completed;
  };
  if (typeof navigator !== "undefined" && navigator.locks)
    return navigator.locks.request(
      prefix + test.id + ":" + attempt.id,
      finalize,
    );
  return finalize();
}

/** Query boundary for same-profile completed history; no generated catalogue history is mixed in. */
export function readCompletedAttemptHistory(
  tests: readonly MockTest[],
  storage: Storage = localStorage,
) {
  return tests.flatMap((test) =>
    readDemoAttempts(test, storage)
      .filter((attempt) => attempt.completedAt !== null)
      .map((attempt) => ({ test, attempt })),
  );
}
