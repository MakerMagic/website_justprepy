import { demoQuestionBank } from "../questions/question-bank.fixtures";
import {
  demoAttemptResult,
  DEMO_ATTEMPT_OWNER,
  type DemoMockAttempt,
} from "./mock-test-attempt.logic";
import { mockResultModel } from "./mock-test-results.logic";
import type { MockTest, MockResultSectionId } from "./mock-tests.types";
export const ANALYTICS_SUBJECTS = [
  "Critical Thinking",
  "Problem Solving",
  "Mathematics",
] as const;
export type AnalyticsSubject = (typeof ANALYTICS_SUBJECTS)[number];
export type AnalyticsPeriod = "Last Week" | "Last Month";
export const SUBJECT_IDS: Record<AnalyticsSubject, MockResultSectionId> = {
  "Critical Thinking": "ct",
  "Problem Solving": "ps",
  Mathematics: "m",
};
export interface AttemptHistoryEntry {
  test: MockTest;
  attempt: DemoMockAttempt;
}
export interface Performance {
  correct: number;
  total: number;
  percent: number;
}
export const roundAnalytics = (value: number) => Math.round(value * 10) / 10;
export const configurationName = (type: MockTest["type"]) =>
  type === "full"
    ? "Full test"
    : type === "math"
      ? "Mathematics only"
      : "Critical Thinking + Problem Solving only";
export function includedSubjects(test: MockTest): AnalyticsSubject[] {
  return ANALYTICS_SUBJECTS.filter(
    (name) =>
      test.subjects[
        name === "Mathematics"
          ? "mathematics"
          : name === "Critical Thinking"
            ? "criticalThinking"
            : "problemSolving"
      ] !== null,
  );
}
export function analyticsTopicNames(subject: AnalyticsSubject) {
  return demoQuestionBank.subjects
    .find((row) => row.name === subject)!
    .topics.map((row) => row.name);
}
/** Ownership must be known; legacy unowned records are not silently attributed to someone. */
export function previousComparable(
  current: AttemptHistoryEntry,
  history: readonly AttemptHistoryEntry[],
) {
  const owner = current.attempt.analytics?.ownerId,
    completed = current.attempt.completedAt;
  if (!owner || owner !== DEMO_ATTEMPT_OWNER || completed === null) return null;
  const config = current.attempt.analytics?.configuration ?? current.test.type;
  return (
    history
      .filter(
        (row) =>
          row.attempt.id !== current.attempt.id &&
          row.attempt.analytics?.ownerId === owner &&
          row.attempt.completedAt !== null &&
          row.attempt.completedAt < completed &&
          (row.attempt.analytics?.configuration ?? row.test.type) === config &&
          includedSubjects(row.test).join("|") ===
            includedSubjects(current.test).join("|"),
      )
      .sort(
        (a, b) =>
          b.attempt.completedAt! - a.attempt.completedAt! ||
          a.attempt.id.localeCompare(b.attempt.id),
      )[0] ?? null
  );
}
export function performance(
  entry: AttemptHistoryEntry | null,
  subject: AnalyticsSubject,
  topic?: string,
): Performance | null {
  if (
    !entry ||
    entry.attempt.completedAt === null ||
    !includedSubjects(entry.test).includes(subject)
  )
    return null;
  const capture = entry.attempt.analytics;
  if (!capture || capture.ownerId !== DEMO_ATTEMPT_OWNER) return null;
  const result = demoAttemptResult(entry.test, entry.attempt)?.result;
  const metadata = new Map(capture.questions.map((q) => [q.id, q]));
  const questions = result?.details?.questions.filter(
    (q) =>
      metadata.get(q.id)?.subject === SUBJECT_IDS[subject] &&
      (topic === undefined || metadata.get(q.id)?.topic === topic),
  );
  if (!questions?.length) return null;
  const correct = questions.filter((q) => q.status === "correct").length;
  return {
    correct,
    total: questions.length,
    percent: (correct / questions.length) * 100,
  };
}
export function comparisonDelta(
  current: number | null,
  previous: number | null,
) {
  return current === null || previous === null
    ? null
    : roundAnalytics(current - previous);
}
export function comparisonTone(delta: number | null) {
  return delta === null
    ? "none"
    : delta === 0
      ? "same"
      : delta > 0
        ? "up"
        : "down";
}
export function topicComparison(
  current: AttemptHistoryEntry | null,
  previous: AttemptHistoryEntry | null,
  subject: AnalyticsSubject,
) {
  return analyticsTopicNames(subject).map((name) => {
    const c = performance(current, subject, name),
      p = performance(previous, subject, name);
    return {
      name,
      current: c,
      previous: p,
      delta: comparisonDelta(c?.percent ?? null, p?.percent ?? null),
    };
  });
}
/** Rolling 7/30 days ending at this completion. Only observed per-question samples; no synthetic history. */
export function averageQuestionTimes(
  current: AttemptHistoryEntry | null,
  history: readonly AttemptHistoryEntry[],
  subject: AnalyticsSubject,
  period: AnalyticsPeriod,
) {
  const owner = current?.attempt.analytics?.ownerId,
    until = current?.attempt.completedAt;
  if (
    !owner ||
    owner !== DEMO_ATTEMPT_OWNER ||
    until == null ||
    !current ||
    !includedSubjects(current.test).includes(subject)
  )
    return { rows: [], average: null, samples: 0 };
  const from = until - (period === "Last Week" ? 7 : 30) * 86400000;
  const buckets = new Map<string, { ms: number; count: number }>();
  const seen = new Set<string>();
  for (const entry of [current, ...history]) {
    const a = entry.attempt,
      capture = a.analytics;
    if (
      seen.has(a.id) ||
      a.completedAt === null ||
      a.completedAt < from ||
      a.completedAt > until ||
      capture?.ownerId !== owner
    )
      continue;
    seen.add(a.id);
    for (const question of capture.questions) {
      if (
        question.subject !== SUBJECT_IDS[subject] ||
        !question.topic ||
        !analyticsTopicNames(subject).includes(question.topic)
      )
        continue;
      const ms = capture.questionTimeMs[question.id];
      if (ms === undefined || ms <= 0 || !Number.isFinite(ms)) continue;
      const bucket = buckets.get(question.topic) ?? { ms: 0, count: 0 };
      bucket.ms += ms;
      bucket.count++;
      buckets.set(question.topic, bucket);
    }
  }
  const rows = [...buckets]
    .map(([name, b]) => ({
      name,
      seconds: b.ms / b.count / 1000,
      samples: b.count,
    }))
    .sort((a, b) => b.seconds - a.seconds || a.name.localeCompare(b.name));
  const total = [...buckets.values()].reduce(
    (s, b) => ({ ms: s.ms + b.ms, count: s.count + b.count }),
    { ms: 0, count: 0 },
  );
  return {
    rows,
    average: total.count ? total.ms / total.count / 1000 : null,
    samples: total.count,
  };
}
export function sectionComparisons(
  current: AttemptHistoryEntry | null,
  previous: AttemptHistoryEntry | null,
) {
  if (!current) return [];
  const c = mockResultModel(
    demoAttemptResult(current.test, current.attempt) ?? current.test,
  );
  const p = previous
    ? mockResultModel(
        demoAttemptResult(previous.test, previous.attempt) ?? previous.test,
      )
    : null;
  return includedSubjects(current.test).map((name) => {
    const id = SUBJECT_IDS[name],
      cs = c?.sections.find((s) => s.id === id)?.result,
      ps = p?.sections.find((s) => s.id === id)?.result;
    const currentAccuracy = performance(current, name),
      previousAccuracy = performance(previous, name);
    const scaled = !!cs && !!ps;
    const cv = scaled
      ? roundAnalytics((cs.score / cs.maxScore) * 100)
      : (currentAccuracy?.percent ?? null);
    const pv = scaled
      ? roundAnalytics((ps.score / ps.maxScore) * 100)
      : (previousAccuracy?.percent ?? null);
    return {
      name,
      current: cv,
      previous: pv,
      delta: comparisonDelta(cv, pv),
      unit: scaled ? "Scaled section score" : "Correct-answer accuracy",
      currentLabel: scaled
        ? cs.score + " / " + cs.maxScore
        : currentAccuracy
          ? currentAccuracy.correct + " / " + currentAccuracy.total
          : "Unavailable",
      previousLabel: scaled
        ? ps.score + " / " + ps.maxScore
        : previousAccuracy
          ? previousAccuracy.correct + " / " + previousAccuracy.total
          : "Unavailable",
    };
  });
}
export function formatQuestionTime(seconds: number) {
  const rounded = Math.round(seconds);
  return rounded >= 60
    ? Math.floor(rounded / 60) +
        "m " +
        String(rounded % 60).padStart(2, "0") +
        "s"
    : rounded + "s";
}
