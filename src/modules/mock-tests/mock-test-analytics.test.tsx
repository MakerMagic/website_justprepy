import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { demoMockTests } from "./mock-tests.fixtures";
import {
  createDemoAttempt,
  attemptDeadline,
  demoExamQuestions,
  demoAttemptResult,
  validateDemoAttempt,
} from "./mock-test-attempt.logic";
import {
  saveDemoAttempt,
  finalizeDemoAttempt,
  readDemoAttempts,
  readCompletedAttemptHistory,
} from "./mock-test-attempt.storage";
import {
  previousComparable,
  topicComparison,
  sectionComparisons,
  averageQuestionTimes,
  performance,
  comparisonTone,
  comparisonDelta,
  analyticsTopicNames,
  formatQuestionTime,
  type AttemptHistoryEntry,
} from "./mock-test-analytics.logic";
import { MockTestAnalytics } from "./mock-test-analytics";
import type { MockTest } from "./mock-tests.types";
const full = demoMockTests[0],
  now = Date.UTC(2026, 9, 30, 12);
function memory(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
    },
    clear: () => data.clear(),
  };
}
function entry(
  id: string,
  days = 0,
  test: MockTest = full,
): AttemptHistoryEntry {
  const at = now - days * 864e5;
  return {
    test,
    attempt: {
      ...createDemoAttempt(test, "demo-attempt-" + id, at - 60000),
      completedAt: at,
    },
  };
}
function results(e: AttemptHistoryEntry, correct: number) {
  const qs = demoExamQuestions(e.test);
  e.attempt.analytics!.result = {
    score: null,
    completedAt: new Date(e.attempt.completedAt!).toISOString(),
    details: {
      sessionId: e.attempt.id,
      timeSpentMinutes: 1,
      sections: [],
      questions: qs.map((q, i) => ({
        id: q.id,
        number: i + 1,
        section: q.examSection === "math" ? "m" : "ct",
        status: i < correct ? "correct" : "incorrect",
      })),
    },
  };
  return e;
}
describe("Advanced Mock Test attempt analytics", () => {
  it("selects closest earlier completion across test IDs with the same configuration and owner", () => {
    const c = entry("current"),
      old = entry("old", 4),
      near = entry("near", 1, demoMockTests[3]),
      math = entry("math", 0.1, demoMockTests[2]),
      future = entry("future", -1),
      active = entry("active", 0.2),
      foreign = entry("foreign", 0.3),
      legacy = entry("legacy", 0.4);
    active.attempt.completedAt = null;
    foreign.attempt.analytics!.ownerId = "another-profile";
    delete legacy.attempt.analytics;
    expect(
      previousComparable(c, [
        c,
        math,
        future,
        active,
        old,
        foreign,
        legacy,
        near,
      ]),
    ).toBe(near);
  });
  it("does not compare equal completion times, itself, incompatible subjects or unknown ownership", () => {
    const c = entry("current"),
      same = entry("same"),
      other = entry("other", 1, {
        ...full,
        subjects: { ...full.subjects, problemSolving: null },
      });
    expect(previousComparable(c, [c, same, other])).toBeNull();
    delete c.attempt.analytics;
    expect(previousComparable(c, [entry("old", 1)])).toBeNull();
  });
  it("retains the saved configuration and deadline if catalogue presentation later changes", async () => {
    const storage = memory(),
      a = createDemoAttempt(full, "demo-attempt-config", now);
    saveDemoAttempt(a, storage);
    const done = await finalizeDemoAttempt(full, a, now + 1000, storage);
    const changed = {
      ...full,
      title: "Changed title",
      maxScore: 500,
      durationMinutes: 999,
    };
    expect(demoAttemptResult(changed, done)?.title).toBe(full.title);
    expect(demoAttemptResult(changed, done)?.maxScore).toBe(full.maxScore);
    expect(attemptDeadline(changed, a)).toBe(
      now + full.durationMinutes * 60000,
    );
  });
  it("compares scaled section percentages only when both attempts have official matching units", () => {
    const c = results(entry("current"), 0),
      p = results(entry("prev", 1), 60);
    for (const [e, score] of [
      [c, 60],
      [p, 40],
    ] as const) {
      e.attempt.analytics!.result!.score = score * 3;
      e.attempt.analytics!.result!.details!.sections = (
        ["m", "ct", "ps"] as const
      ).map((id) => ({ id, score, maxScore: 80 }));
    }
    expect(
      sectionComparisons(c, p).every(
        (row) =>
          row.unit === "Scaled section score" &&
          row.current === 75 &&
          row.previous === 50 &&
          row.delta === 25,
      ),
    ).toBe(true);
  });
  it("uses exactly the established 7/3/5 topics", () => {
    expect(analyticsTopicNames("Critical Thinking")).toHaveLength(7);
    expect(analyticsTopicNames("Problem Solving")).toHaveLength(3);
    expect(analyticsTopicNames("Mathematics")).toEqual([
      "Units",
      "Numbers",
      "Ratio and Proportion",
      "Algebra",
      "Geometry",
    ]);
  });
  it("derives accuracy from existing evaluated question IDs, including omissions in the denominator", () => {
    const e = results(entry("accuracy"), 31);
    expect(performance(e, "Mathematics")).toEqual({
      correct: 30,
      total: 30,
      percent: 100,
    });
    expect(performance(e, "Critical Thinking")).toEqual({
      correct: 1,
      total: 30,
      percent: 100 / 30,
    });
    expect(performance(e, "Problem Solving")).toBeNull();
    expect(performance(e, "Mathematics", "Algebra")).toBeNull();
  });
  it("rounds percentage-point change only after comparing exact ratios", () => {
    const current = results(entry("now"), 32),
      prev = results(entry("before", 1), 31);
    const row = topicComparison(current, prev, "Critical Thinking").find(
      (r) => r.name === "Detecting Flaws",
    )!;
    expect(row.delta).toBe(3.3);
  });
  it("does not fabricate subject or topic statistics for absent, unmapped or historical records", () => {
    const e = entry("math", 0, demoMockTests[2]);
    expect(performance(e, "Critical Thinking")).toBeNull();
    expect(
      topicComparison(e, null, "Mathematics").every(
        (q) => q.current === null && q.delta === null,
      ),
    ).toBe(true);
    delete e.attempt.analytics;
    expect(performance(e, "Mathematics")).toBeNull();
  });
  it("uses relative change, not absolute accuracy, for green/red/neutral indicators", () => {
    expect(comparisonTone(comparisonDelta(80, 90))).toBe("down");
    expect(comparisonTone(comparisonDelta(30, 20))).toBe("up");
    expect(comparisonTone(comparisonDelta(60, 60))).toBe("same");
    expect(comparisonTone(comparisonDelta(80, null))).toBe("none");
  });
  it("preserves actual numerator/denominator and differences in topic tooltips", () => {
    const c = results(entry("current"), 60),
      p = results(entry("previous", 1), 30);
    const row = topicComparison(c, p, "Critical Thinking").find(
      (r) => r.name === "Detecting Flaws",
    )!;
    expect(row.current).toEqual({ correct: 30, total: 30, percent: 100 });
    expect(row.previous).toEqual({ correct: 0, total: 30, percent: 0 });
    expect(row.delta).toBe(100);
  });
  it("compares section metrics in matching units and keeps unavailable official points separate", () => {
    const rows = sectionComparisons(
      results(entry("current"), 60),
      results(entry("previous", 1), 30),
    );
    expect(rows[0]).toMatchObject({
      name: "Critical Thinking",
      unit: "Correct-answer accuracy",
      delta: 100,
    });
    expect(rows.find((r) => r.name === "Problem Solving")?.delta).toBeNull();
  });
  it("weights time by observed question count, respects week/month, excludes future and foreign samples", () => {
    const c = entry("current"),
      old = entry("old", 10),
      foreign = entry("foreign", 1),
      future = entry("future", -1);
    const qs = demoExamQuestions(full).filter(
      (q) => q.examSection === "crit-ps",
    );
    c.attempt.analytics!.questionTimeMs = {
      [qs[0].id]: 10000,
      [qs[1].id]: 30000,
    };
    old.attempt.analytics!.questionTimeMs = { [qs[0].id]: 80000 };
    foreign.attempt.analytics!.ownerId = "another-profile";
    foreign.attempt.analytics!.questionTimeMs = { [qs[0].id]: 900000 };
    future.attempt.analytics!.questionTimeMs = { [qs[0].id]: 900000 };
    expect(
      averageQuestionTimes(
        c,
        [c, old, foreign, future],
        "Critical Thinking",
        "Last Week",
      ),
    ).toMatchObject({ average: 20, samples: 2 });
    expect(
      averageQuestionTimes(
        c,
        [old, foreign, future],
        "Critical Thinking",
        "Last Month",
      ),
    ).toMatchObject({ average: 40, samples: 3 });
  });
  it("never treats unobserved/zero/mismatched-topic time as a timing sample", () => {
    const e = entry("time"),
      qs = demoExamQuestions(full);
    e.attempt.analytics!.questionTimeMs = { [qs[0].id]: 60000 };
    expect(
      averageQuestionTimes(e, [], "Mathematics", "Last Week").rows,
    ).toEqual([]);
    expect(
      averageQuestionTimes(null, [], "Critical Thinking", "Last Month").average,
    ).toBeNull();
    expect(formatQuestionTime(119.7)).toBe("2m 00s");
  });
  it("manual Finish and timeout persist the same evaluation structure and one immutable completion", async () => {
    for (const timeout of [false, true]) {
      const s = memory();
      const a = createDemoAttempt(
        full,
        "demo-attempt-" + (timeout ? "timeout" : "manual"),
        now,
      );
      a.answers[demoExamQuestions(full)[0].id] = "B";
      a.analytics!.questionTimeMs[a.currentId] = 1000;
      saveDemoAttempt(a, s);
      const write = vi.spyOn(s, "setItem");
      const done = await finalizeDemoAttempt(
        full,
        a,
        now + (timeout ? full.durationMinutes * 60000 : 10000),
        s,
      );
      expect(done.analytics?.result?.details?.sessionId).toBe(a.id);
      const counts = done.analytics!.result!.details!.questions;
      expect(counts).toHaveLength(full.questionCount);
      expect(counts.filter((q) => q.status === "omitted")).toHaveLength(59);
      expect(done.analytics?.questionTimeMs[a.currentId]).toBe(1000);
      expect(await finalizeDemoAttempt(full, a, now + 99999999, s)).toEqual(
        done,
      );
      expect(write).toHaveBeenCalledTimes(1);
      expect(validateDemoAttempt(done, full)).toBe(true);
      expect(demoAttemptResult(full, done)?.result).toBe(
        done.analytics?.result,
      );
    }
  });
  it("retains multiple attempts across fresh storage readers and excludes foreign ownership", async () => {
    const s = memory();
    for (const id of ["one", "two"]) {
      const a = createDemoAttempt(full, "demo-attempt-" + id, now);
      saveDemoAttempt(a, s);
      await finalizeDemoAttempt(full, a, now + 1000, s);
    }
    const foreign = entry("foreign");
    foreign.attempt.analytics!.ownerId = "different";
    saveDemoAttempt(foreign.attempt, s);
    expect(readDemoAttempts(full, s)).toHaveLength(2);
    expect(
      readCompletedAttemptHistory(demoMockTests, s)
        .map((r) => r.attempt.id)
        .sort(),
    ).toEqual(["demo-attempt-one", "demo-attempt-two"]);
  });
  it("accepts unchanged legacy records but rejects corrupt new capture without overwriting history", () => {
    const e = entry("legacy");
    delete e.attempt.analytics;
    expect(validateDemoAttempt(e.attempt, full)).toBe(true);
    const bad = entry("bad");
    bad.attempt.analytics!.questionTimeMs.unknown = 500;
    expect(validateDemoAttempt(bad.attempt, full)).toBe(false);
  });
  it("renders all four source sections, exact controls, and honest missing-data states without launchers", () => {
    const e = results(entry("render"), 35),
      test = demoAttemptResult(full, e.attempt)!;
    const html = renderToStaticMarkup(
      <MockTestAnalytics
        open={false}
        onClose={() => {}}
        test={test}
        attempt={e.attempt}
      />,
    );
    for (const title of [
      "Overall Result &amp; Answer Distribution",
      "Average Time per Question",
      "Comparison with Previous Comparable Mock Test",
      "Topic-Level Performance Comparison",
      "Last Week",
      "Last Month",
      "No timing data yet",
      "No previous comparable Mock Test",
    ])
      expect(html).toContain(title);
    expect(html).not.toContain("Demo scenario");
    expect(html).not.toContain("184");
    expect(html).toContain("Official scoring is not connected");
  });
});
