import {
  validateDemoAttempt,
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
      if (validateDemoAttempt(candidate, test)) attempts.push(candidate);
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
