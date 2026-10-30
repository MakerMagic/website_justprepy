import { describe, expect, it, vi } from "vitest";
import { demoMockTests } from "./mock-tests.fixtures";
import {
  attemptDeadline,
  attemptExpired,
  createDemoAttempt,
  demoExamQuestions,
  changeDemoAttempt,
  demoAttemptResult,
} from "./mock-test-attempt.logic";
import {
  finalizeDemoAttempt,
  saveDemoAttempt,
  readDemoAttempts,
} from "./mock-test-attempt.storage";
const test = demoMockTests[0],
  qs = demoExamQuestions(test);
function memory() {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
    removeItem: (k: string) => {
      data.delete(k);
    },
    clear: () => data.clear(),
  } satisfies Storage;
}
describe("Configured Mock Test expiry", () => {
  for (const t of demoMockTests)
    it(`${t.id} uses its configured duration and original start time`, () => {
      const a = createDemoAttempt(t, "demo-attempt-timeout", 1000),
        deadline = 1000 + t.durationMinutes * 60000;
      expect(attemptDeadline(t, a)).toBe(deadline);
      expect(attemptExpired(t, a, deadline - 1)).toBe(false);
      expect(attemptExpired(t, a, deadline)).toBe(true);
      expect(attemptExpired(t, a, deadline + 1)).toBe(true);
    });
  for (const inSecond of [false, true])
    it(`expires in ${inSecond ? "CT/PS" : "Mathematics"} without unlocking or dropping answers`, async () => {
      const storage = memory();
      let a = createDemoAttempt(test, "demo-attempt-timeout", 1000);
      a = changeDemoAttempt(a, qs, {
        kind: "answer",
        id: qs[0].id,
        option: "B",
      });
      if (inSecond) {
        a = changeDemoAttempt(a, qs, { kind: "finish-section" });
        a = changeDemoAttempt(a, qs, {
          kind: "answer",
          id: qs[30].id,
          option: "D",
        });
      }
      saveDemoAttempt(a, storage);
      const done = await finalizeDemoAttempt(
        test,
        a,
        attemptDeadline(test, a) + 900000,
        storage,
      );
      expect(done.completedAt).toBe(attemptDeadline(test, a));
      expect(done.completedSections).toEqual(inSecond ? ["math"] : []);
      expect(done.answers).toEqual(a.answers);
      expect(
        demoAttemptResult(test, done)!.result!.details!.questions.filter(
          (q) => q.status === "omitted",
        ),
      ).toHaveLength(inSecond ? 58 : 59);
      expect(
        changeDemoAttempt(done, qs, {
          kind: "answer",
          id: done.currentId,
          option: "A",
        }),
      ).toBe(done);
    });
  it("overlapping manual/automatic submissions keep exactly one immutable completion", async () => {
    const storage = memory(),
      a = createDemoAttempt(test, "demo-attempt-once", 1000);
    saveDemoAttempt(a, storage);
    const write = vi.spyOn(storage, "setItem");
    const [manual, timeout] = await Promise.all([
      finalizeDemoAttempt(test, a, attemptDeadline(test, a) - 1, storage),
      finalizeDemoAttempt(test, a, attemptDeadline(test, a), storage),
    ]);
    expect(timeout).toEqual(manual);
    expect(write).toHaveBeenCalledTimes(1);
    expect(readDemoAttempts(test, storage)).toEqual([manual]);
  });
  it("finalization re-reads the last saved selection rather than a stale component snapshot", async () => {
    const storage = memory(),
      stale = createDemoAttempt(test, "demo-attempt-latest", 1000);
    const latest = changeDemoAttempt(stale, qs, {
      kind: "answer",
      id: qs[0].id,
      option: "E",
    });
    saveDemoAttempt(latest, storage);
    const done = await finalizeDemoAttempt(
      test,
      stale,
      attemptDeadline(test, stale),
      storage,
    );
    expect(done.answers[qs[0].id]).toBe("E");
  });
  it("a failed write never creates a completed result", async () => {
    const storage = memory(),
      a = createDemoAttempt(test, "demo-attempt-fail", 1000);
    saveDemoAttempt(a, storage);
    storage.setItem = () => {
      throw Error("Storage full");
    };
    await expect(
      finalizeDemoAttempt(test, a, attemptDeadline(test, a), storage),
    ).rejects.toThrow("Storage full");
    expect(readDemoAttempts(test, storage)[0].completedAt).toBeNull();
  });
});
