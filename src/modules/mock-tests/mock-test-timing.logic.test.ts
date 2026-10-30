import { describe, it, expect } from "vitest";
import {
  createDemoAttempt,
  changeDemoAttempt,
  demoExamQuestions,
  finishDemoAttempt,
} from "./mock-test-attempt.logic";
import { observeQuestionTime } from "./mock-test-timing.logic";
import { demoMockTests } from "./mock-tests.fixtures";
const test = demoMockTests[0],
  qs = demoExamQuestions(test),
  deadline = 100000;
describe("visible per-question timing", () => {
  it("starts a new observation on mount; never charges time before refresh/resume", () => {
    const a = createDemoAttempt(test, "demo-attempt-timing", 1000);
    const r = observeQuestionTime(a, null, 20000, true, deadline);
    expect(r.attempt).toBe(a);
    expect(r.cursor.at).toBe(20000);
  });
  it("sums visits to the same question without leaking time across IDs", () => {
    let a = createDemoAttempt(test, "demo-attempt-timing", 1000);
    a = observeQuestionTime(
      a,
      { id: qs[0].id, at: 1000, visible: true },
      2500,
      true,
      deadline,
    ).attempt;
    a = changeDemoAttempt(a, qs, { kind: "navigate", id: qs[1].id });
    a = observeQuestionTime(
      a,
      { id: qs[1].id, at: 2500, visible: true },
      3000,
      true,
      deadline,
    ).attempt;
    expect(a.analytics?.questionTimeMs).toEqual({
      [qs[0].id]: 1500,
      [qs[1].id]: 500,
    });
  });
  it("stops at hidden-tab transition and restarts without charging hidden time", () => {
    const a = createDemoAttempt(test, "demo-attempt-timing", 1000);
    let r = observeQuestionTime(
      a,
      { id: a.currentId, at: 1000, visible: true },
      2000,
      false,
      deadline,
    );
    r = observeQuestionTime(r.attempt, r.cursor, 12000, true, deadline);
    r = observeQuestionTime(r.attempt, r.cursor, 13000, true, deadline);
    expect(r.attempt.analytics?.questionTimeMs[a.currentId]).toBe(2000);
  });
  it("caps timing at the test deadline and leaves completed attempts immutable", () => {
    let a = createDemoAttempt(test, "demo-attempt-timing", 1000);
    a = observeQuestionTime(
      a,
      { id: a.currentId, at: 99000, visible: true },
      110000,
      true,
      deadline,
    ).attempt;
    expect(a.analytics?.questionTimeMs[a.currentId]).toBe(1000);
    a = finishDemoAttempt(a, deadline);
    expect(
      observeQuestionTime(
        a,
        { id: a.currentId, at: deadline, visible: true },
        120000,
        true,
        deadline,
      ).attempt,
    ).toBe(a);
  });
  it("does not fabricate timing for legacy attempts without a capture", () => {
    const a = createDemoAttempt(test, "demo-attempt-timing", 1000);
    delete a.analytics;
    expect(
      observeQuestionTime(
        a,
        { id: a.currentId, at: 1000, visible: true },
        2000,
        true,
        deadline,
      ).attempt,
    ).toBe(a);
  });
  it("ignores stale question cursors and backwards clock movement", () => {
    const a = createDemoAttempt(test, "demo-attempt-timing", 1000);
    expect(
      observeQuestionTime(
        a,
        { id: qs[1].id, at: 1000, visible: true },
        2000,
        true,
        deadline,
      ).attempt,
    ).toBe(a);
    expect(
      observeQuestionTime(
        a,
        { id: a.currentId, at: 2000, visible: true },
        1500,
        true,
        deadline,
      ).attempt,
    ).toBe(a);
  });
  it("does not double-count overlapping visible observations from two views", () => {
    let a = createDemoAttempt(test, "demo-attempt-overlap", 1000);
    a = observeQuestionTime(
      a,
      { id: a.currentId, at: 1000, visible: true },
      2000,
      true,
      deadline,
    ).attempt;
    a = observeQuestionTime(
      a,
      { id: a.currentId, at: 1500, visible: true },
      2500,
      true,
      deadline,
    ).attempt;
    expect(a.analytics?.questionTimeMs[a.currentId]).toBe(1500);
  });
});
